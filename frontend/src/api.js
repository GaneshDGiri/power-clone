import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000' });

export const uploadFile = (formData) => API.post('/upload', formData);
export const getDatasets = () => API.get('/datasets');
export const getColumns = (id) => API.get(`/datasets/${id}/columns`);
export const queryData = (payload) => API.post('/query', payload);