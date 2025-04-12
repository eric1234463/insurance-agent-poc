import { Step, Workflow } from '@mastra/core';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { insuranceAgent } from '../agents/insurance-agent';

// Remove .mastra/output from current working directory to get project root
const projectRoot = process.cwd().replace('/.mastra/output', '');

const PDF_PATH = path.join(
  projectRoot,
  'src/rag-data/pdf/LPPM 848-2401C FortuneXtra Savings Plan PFFS (Chi).pdf'
);

const prepareVectorDatabaseStep = new Step({
  id: 'prepareVectorDatabase',
  execute: async ({ context }) => {
    try {
      if (!fs.existsSync(PDF_PATH)) {
        throw new Error(`PDF file not found at path: ${PDF_PATH}`);
      }

      // 1. Load PDF
      const loader = new PDFLoader(PDF_PATH, {
        splitPages: true,
      });
      const docs = await loader.load();

      // 2. Split text into semantically meaningful chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,         // Smaller chunks for better semantic meaning
        chunkOverlap: 100,      // Overlap to maintain context
        separators: [           // Custom separators for insurance documents
          "\n\n",              // Double line breaks often indicate section boundaries
          "\n",                // Single line breaks
          "。",                // Chinese full stop
          ".",                 // English full stop
          "！",                // Chinese exclamation
          "!",                 // English exclamation
          "？",                // Chinese question mark
          "?",                 // English question mark
          ";",                 // Semicolon
          "；"                 // Chinese semicolon
        ],
        lengthFunction: (text) => text.length, // Character count for Chinese text
      });
      const splitDocs = await textSplitter.splitDocuments(docs);

      // 3. Initialize OpenAI embeddings with higher dimension for better semantic search
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "text-embedding-3-large", // Using latest embedding model
        dimensions: 3072, // Maximum dimensions for better semantic understanding
      });

      // 4. Create and store vectors with metadata
      const vectorStore = await MemoryVectorStore.fromDocuments(
        splitDocs.map(doc => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            chunk_type: "insurance_policy",
            language: "zh-CN",
            source: "FortuneXtra_Savings_Plan",
          }
        })),
        embeddings,
      );
      
      return {
        vectorStore,
        status: 'success',
      };
    } catch (error) {
      console.error('Error preparing vector database:', error);
      return {
        status: 'error',
        vectorStore: null,
        error: error instanceof Error ? error.message : 'Unknown error preparing vector database',
      };
    }
  },
});

const generateResponseStep = new Step({
  id: 'generateResponse',
  execute: async ({ context }) => {
    try {
      const { vectorStore } = context.steps.prepareVectorDatabase.status === 'success' ? context.steps.prepareVectorDatabase.output : null;
      
      // Search for relevant documents with semantic search
      const relevantDocs = await vectorStore.similaritySearch(
        context.triggerData.question,
        5,  // Reduced number of documents for more focused results
        (doc: { metadata: { language: string; }; }) => doc.metadata.language === "zh-CN" // Filter for Chinese documents
      );

      console.log('relevantDocs', relevantDocs)

      const response = await insuranceAgent.generate([
        {
          role: "system",
          content: `You are an AI insurance expert. Please analyze the following insurance documents and answer the user's question.
            Important guidelines:
            1. Only use information from the provided documents without citing document numbers in parentheses (e.g., avoid formats like "（文件1）" or "(Document 1)")
            2. If the information isn't in the documents, acknowledge the limitation
            3. Cite specific sections when possible
            4. Focus on accuracy and relevance

            Retrieved insurance documents:
            ----------------------------
            ${relevantDocs.map((doc: { pageContent: any; }, index: number) => `[Document ${index + 1}]:\n${doc.pageContent}\n`).join('\n')}
            ----------------------------`
        },
        { role: "user", content: context.triggerData.question }
      ]);
      
      return {
        status: 'success',
        response: response.text,
      };
    } catch (error) {
      console.error('Error generating response:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error generating response',
      };
    }
  },
});

export const insuranceFaqWorkflow = new Workflow({
  name: 'Insurance FAQ',
  triggerSchema: z.object({
    question: z.string(),
  }),
})
.step(prepareVectorDatabaseStep)
.then(generateResponseStep);

