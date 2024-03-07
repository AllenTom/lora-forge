import { net } from 'electron';
import { Project, ProjectMeta, SavedProject } from '../../../types';
import fs from 'fs';
import axios from 'axios';
import path from 'path';

var FormData = require('form-data');
export const getBaseUrl = () => {
  let port = 8000;
  return `http://localhost:${port}`;
};
export type ApiResponse<T> = {
  result: string,
  error?: string,
  data?: T
}
const makeSDWebAPIRequest = async <T>(
  {
    url,
    method = 'GET',
    body,
    queryParma,
    filePaths
  }:
    { url: string, method?: string, body?: any, queryParma?: any, filePaths?: any[] }): Promise<T | Error> => {
  if (queryParma) {
    const query = Object.keys(queryParma).map(key => `${key}=${queryParma[key]}`).join('&');
    url = `${url}?${query}`;
  }
  const formData = new FormData();
  if (filePaths && filePaths.length > 0) {
    for (let i = 0; i < filePaths.length; i++) {
      formData.append('file', fs.createReadStream(filePaths[i]));
    }
  }
  const headersToAdd = formData.getHeaders();
  return new Promise((resolve, reject) => {
    const request = net.request({
      url,
      method

    });
    if (headersToAdd) {
      request.setHeader('Content-Type', headersToAdd['content-type']);
      request.setHeader('Content-Length', headersToAdd['content-length']);
      request.setHeader('boundary', headersToAdd['boundary']);
      request.setHeader('Content-Disposition', headersToAdd['content-disposition']);
      request.setHeader('Content-Transfer-Encoding', headersToAdd['content-transfer-encoding']);
    }
    if (body) {
      request.write(JSON.stringify(body));
    }


    request.on('response', (response) => {
      let responseData = '';

      response.on('data', (chunk) => {
        responseData += chunk.toString();
      });

      response.on('end', () => {
        resolve(JSON.parse(responseData));
      });
    });

    request.on('error', (error) => {
      console.error(error);
      reject(error);
    });

    request.end();
  });
};
const makeSDWebAPIRequest2 = async <T>(
  {
    url,
    method = 'GET',
    body,
    queryParma,
    filePaths
  }:
    {
      url: string,
      method?: string,
      body?: any,
      queryParma?: any,
      filePaths?: any[]
    }): Promise<T | Error> => {
  let formData = undefined;
  if (filePaths) {
    formData = new FormData();
    for (let i = 0; i < filePaths.length; i++) {
      formData.append('file', fs.readFileSync(filePaths[i]), path.basename(filePaths[i]));
    }
  }
  let headers: any = {};
  if (formData) {
    headers = formData.getHeaders();
    headers['Content-Type'] = 'multipart/form-data';
  }
  const response = await axios.request<T>({
    url,
    method,
    data: formData ? formData : body,
    params: queryParma,
    headers: headers
  });
  return response.data;


};
export type NewProjectRequestBody = {
  name: string,
  width: number,
  height: number,
}

class Client {
  async newProject(param: NewProjectRequestBody): Promise<ApiResponse<Project>> {
    const response = await makeSDWebAPIRequest2<ApiResponse<Project>>({
      url: `${getBaseUrl()}/action/newproject`,
      method: 'POST',
      body: param
    });
    if (response instanceof Error) {
      throw response;
    }
    return response;
  };

  async readProjectMeta(id: string): Promise<ApiResponse<ProjectMeta>> {
    const response = await makeSDWebAPIRequest2<ApiResponse<ProjectMeta>>({
      url: `${getBaseUrl()}/action/getprojectmeta`,
      method: 'GET',
      queryParma: {
        id
      }
    });
    if (response instanceof Error) {
      throw response;
    }
    return response;
  }

  async getProjectList(): Promise<ApiResponse<SavedProject[]>> {
    const response = await makeSDWebAPIRequest2<ApiResponse<SavedProject[]>>({
      url: `${getBaseUrl()}/action/getprojectlist`,
      method: 'GET'
    });
    if (response instanceof Error) {
      throw response;
    }
    return response;
  }

  async loadProject(id: string): Promise<ApiResponse<Project>> {
    const response = await makeSDWebAPIRequest2<ApiResponse<Project>>({
      url: `${getBaseUrl()}/action/loadproject`,
      method: 'POST',
      body: {
        name: id
      }
    });
    if (response instanceof Error) {
      throw response;
    }
    return response;
  }

  async makePreprocess(files: any[], id: string): Promise<ApiResponse<void>> {
    const response = await makeSDWebAPIRequest2<ApiResponse<void>>({
      url: `${getBaseUrl()}/action/makepreorpcess`,
      method: 'POST',
      filePaths: files,
      queryParma: {
        id
      }
    });
    if (response instanceof Error) {
      throw response;
    }
    return response;
  }

}

export const remoteClient = new Client();
