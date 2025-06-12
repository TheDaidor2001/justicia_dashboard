import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ContactService } from '@/services/contact.service'
import type {
  Contact,
  ContactDetail,
  ContactFilters,
  ContactStatistics,
  AssignContactRequest,
  RespondContactRequest,
  UpdateContactStatusRequest,
} from '@/types/contact'

export const useContactStore = defineStore('contact', () => {
  // State
  const contacts = ref<Contact[]>([])
  const currentContact = ref<ContactDetail | null>(null)
  const statistics = ref<ContactStatistics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const total = ref(0)
  const currentPage = ref(1)
  const totalPages = ref(0)
  const pageSize = ref(10)

  // Filters
  const filters = ref<ContactFilters>({
    status: undefined,
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    page: 1,
    limit: 10,
  })

  // Getters
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const pendingContacts = computed(() => contacts.value.filter((c) => c.status === 'pending'))
  const inProgressContacts = computed(() =>
    contacts.value.filter((c) => c.status === 'in_progress'),
  )
  const resolvedContacts = computed(() => contacts.value.filter((c) => c.status === 'resolved'))

  // Actions
  async function fetchContacts(newFilters?: Partial<ContactFilters>) {
    loading.value = true
    error.value = null

    try {
      if (newFilters) {
        filters.value = { ...filters.value, ...newFilters }
      }

      const response = await ContactService.getContacts(filters.value)

      contacts.value = response.contacts
      total.value = response.total
      currentPage.value = response.currentPage
      totalPages.value = response.totalPages
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar los mensajes'
      console.error('Error fetching contacts:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchContactDetail(id: string) {
    loading.value = true
    error.value = null

    try {
      const contact = await ContactService.getContactDetail(id)
      currentContact.value = contact
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar el detalle del mensaje'
      console.error('Error fetching contact detail:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchStatistics() {
    loading.value = true
    error.value = null

    try {
      const stats = await ContactService.getStatistics()
      statistics.value = stats
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar las estadísticas'
      console.error('Error fetching statistics:', err)
    } finally {
      loading.value = false
    }
  }

  async function updateContactStatus(id: string, data: UpdateContactStatusRequest) {
    loading.value = true
    error.value = null

    try {
      const updatedContact = await ContactService.updateContactStatus(id, data)

      // Update the contact in the list
      const index = contacts.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        contacts.value[index] = updatedContact
      }

      // Update current contact if it's the same
      if (currentContact.value?.id === id) {
        await fetchContactDetail(id) // Refresh to get updated actions
      }

      return updatedContact
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar el estado del mensaje'
      console.error('Error updating contact status:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function assignContact(id: string, data: AssignContactRequest) {
    loading.value = true
    error.value = null

    try {
      const updatedContact = await ContactService.assignContact(id, data)

      // Update the contact in the list
      const index = contacts.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        contacts.value[index] = updatedContact
      }

      // Update current contact if it's the same
      if (currentContact.value?.id === id) {
        await fetchContactDetail(id) // Refresh to get updated actions
      }

      return updatedContact
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al asignar el mensaje'
      console.error('Error assigning contact:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function respondContact(id: string, data: RespondContactRequest) {
    loading.value = true
    error.value = null

    try {
      const updatedContact = await ContactService.respondContact(id, data)

      // Update the contact in the list
      const index = contacts.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        contacts.value[index] = updatedContact
      }

      // Update current contact if it's the same
      if (currentContact.value?.id === id) {
        await fetchContactDetail(id) // Refresh to get updated actions
      }

      return updatedContact
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al responder el mensaje'
      console.error('Error responding to contact:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function downloadAttachment(contactId: string, filename: string) {
    try {
      const blob = await ContactService.downloadAttachment(contactId, filename)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al descargar el archivo'
      console.error('Error downloading attachment:', err)
      throw err
    }
  }

  function updateFilters(newFilters: Partial<ContactFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {
      status: undefined,
      startDate: undefined,
      endDate: undefined,
      search: undefined,
      page: 1,
      limit: 10,
    }
  }

  function clearError() {
    error.value = null
  }

  function clearCurrentContact() {
    currentContact.value = null
  }

  return {
    // State
    contacts,
    currentContact,
    statistics,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    pageSize,
    filters,

    // Getters
    isLoading,
    hasError,
    pendingContacts,
    inProgressContacts,
    resolvedContacts,

    // Actions
    fetchContacts,
    fetchContactDetail,
    fetchStatistics,
    updateContactStatus,
    assignContact,
    respondContact,
    downloadAttachment,
    updateFilters,
    clearFilters,
    clearError,
    clearCurrentContact,
  }
})
