
import { Mastra } from '@mastra/core';
import { insuranceFaqWorkflow, insurancePlanWorkflow } from './workflows';

export const mastra = new Mastra({
    workflows: {
        insuranceFaqWorkflow,
        insurancePlanWorkflow,
    }
})
        