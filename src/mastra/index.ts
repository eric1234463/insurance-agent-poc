
import { Mastra } from '@mastra/core';
import { insuranceFaqWorkflow } from './workflows';

export const mastra = new Mastra({
    workflows: {
        insuranceFaqWorkflow,
    }
})
        