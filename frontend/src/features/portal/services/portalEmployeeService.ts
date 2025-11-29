import axios from 'axios';
import { portalTokenStorage } from '../utils/portalTokenStorage';
import { PORTAL_API_BASE } from '../config';

export interface PortalEmployeeDocumentPayload {
  employeeId: number;
  documentType: string;
  file: File;
  issueDate?: string;
  expiresAt?: string;
}

export async function fetchEmployees() {
  const token = portalTokenStorage.getToken();
  const response = await axios.get(`${PORTAL_API_BASE}/employees`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function deleteEmployee(id: number) {
  const token = portalTokenStorage.getToken();
  await axios.delete(`${PORTAL_API_BASE}/employees/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function saveEmployee(payload: any) {
  const token = portalTokenStorage.getToken();
  const { id, ...body } = payload;
  if (id) {
    const response = await axios.put(`${PORTAL_API_BASE}/employees/${id}`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } else {
    const response = await axios.post(`${PORTAL_API_BASE}/employees`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
}

export async function uploadEmployeeDocument(params: PortalEmployeeDocumentPayload) {
  const token = portalTokenStorage.getToken();
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('document_type', params.documentType);
  if (params.issueDate) formData.append('issue_date', params.issueDate);
  if (params.expiresAt) formData.append('expires_at', params.expiresAt);

  await axios.post(
    `${PORTAL_API_BASE}/employees/${params.employeeId}/documents`,
    formData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function deleteEmployeeDocument(employeeId: number, documentId: number) {
  const token = portalTokenStorage.getToken();
  await axios.delete(
    `${PORTAL_API_BASE}/employees/${employeeId}/documents/${documentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
}
