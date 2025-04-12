# Insurance FAQ AI Assistant

An AI-powered insurance FAQ system that processes Chinese insurance documents and provides accurate responses to customer inquiries using RAG (Retrieval-Augmented Generation) technology.

## Features

- PDF document processing with semantic chunking
- Advanced vector search using OpenAI embeddings
- Specialized insurance domain knowledge
- Bilingual support (Chinese/English)
- Context-aware responses with document grounding

## Prerequisites

- Node.js >= 18
- OpenAI API key
- PDF documents in `src/rag-data/pdf/` directory

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd insurance-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_api_key_here
```

## Project Structure

```
├── src/
│   ├── mastra/
│   │   ├── agents/
│   │   │   └── insurance-agent.ts    # AI agent configuration
│   │   ├── workflows/
│   │   │   └── insurance-faq.ts      # Main workflow logic
│   │   └── index.ts                  # Mastra initialization
│   └── rag-data/
│       └── pdf/                      # PDF documents directory
├── package.json
└── README.md
```

## Usage

1. Start the development server:
```bash
npm run dev
```

2. The system processes insurance documents and creates vector embeddings for semantic search.

3. Query the system with insurance-related questions to receive context-aware responses.

## Technical Details

- Uses LangChain for document processing and RAG implementation
- Implements semantic text splitting with custom separators for Chinese text
- Uses OpenAI's text-embedding-3-large model for embeddings
- Maintains context through chunk overlap
- Implements custom metadata for better document tracking

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key

## Dependencies

- @mastra/core: ^0.8.2
- @langchain/openai: ^0.5.5
- @langchain/community: ^0.3.40
- langchain: ^0.3.21
- pdf-parse: ^1.1.1

## Development

The project uses TypeScript and follows a workflow-based architecture:

1. Document Processing:
   - PDF loading and parsing
   - Semantic text splitting
   - Vector embedding generation

2. Query Processing:
   - Semantic search in vector database
   - Context-aware response generation
   - Chinese language optimization

## License

ISC
