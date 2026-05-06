/**
 * Generated from openapi.yaml - Axios client factory
 * Do not edit manually
 */

import axios, { AxiosInstance } from 'axios'
import { TasksClient } from './tasks-client'
import { SubjectsClient } from './subjects-client'

export interface ApiClients {
  tasks: TasksClient
  subjects: SubjectsClient
  axios: AxiosInstance
}

/**
 * Create API clients configured with base URL and auth
 */
export function createApiClients(baseURL?: string): ApiClients {
  const axiosInstance = axios.create({
    baseURL: baseURL || import.meta.env.VITE_API_URL || 'http://localhost:3000',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return {
    tasks: new TasksClient(axiosInstance),
    subjects: new SubjectsClient(axiosInstance),
    axios: axiosInstance,
  }
}

export { TasksClient, SubjectsClient }
