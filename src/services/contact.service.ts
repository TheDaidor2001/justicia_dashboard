import { api } from '@/api/axios'
import type {
  Contact,
  ContactDetail,
  ContactFilters,
  ContactListResponse,
  ContactStatistics,
  AssignContactRequest,
  RespondContactRequest,
  UpdateContactStatusRequest,
} from '@/types/contact'

export class ContactService {
  private static readonly BASE_URL = '/contact'

  static async getContacts(filters: ContactFilters = {}): Promise<ContactListResponse> {
    const params = new URLSearchParams()

    if (filters.status) params.append('status', filters.status)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const response = await api.get<ContactListResponse>(`${this.BASE_URL}?${params}`)
    return response.data
  }

  static async getContactDetail(id: string): Promise<ContactDetail> {
    const response = await api.get<ContactDetail>(`${this.BASE_URL}/${id}`)
    return response.data
  }

  static async getStatistics(): Promise<ContactStatistics> {
    const response = await api.get<ContactStatistics>(`${this.BASE_URL}/statistics`)
    return response.data
  }

  static async updateContactStatus(id: string, data: UpdateContactStatusRequest): Promise<Contact> {
    const response = await api.put<Contact>(`${this.BASE_URL}/${id}/status`, data)
    return response.data
  }

  static async assignContact(id: string, data: AssignContactRequest): Promise<Contact> {
    const response = await api.post<Contact>(`${this.BASE_URL}/${id}/assign`, data)
    return response.data
  }

  static async respondContact(id: string, data: RespondContactRequest): Promise<Contact> {
    const response = await api.post<Contact>(`${this.BASE_URL}/${id}/respond`, data)
    return response.data
  }

  static async downloadAttachment(contactId: string, filename: string): Promise<Blob> {
    const response = await api.get(`${this.BASE_URL}/${contactId}/attachment`, {
      responseType: 'blob',
    })
    return response.data
  }
}
