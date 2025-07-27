import { supabase, DatabasePhoto, PhotoUpload, isSupabaseConfigured } from './supabase'

export class PhotoDatabaseService {
  private tableName = 'photos'

  // Get all photos for a user
  async getPhotos(userId?: string): Promise<DatabasePhoto[]> {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    let query = supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching photos:', error)
      throw new Error('Failed to fetch photos')
    }

    return data || []
  }

  // Upload photo to storage and save metadata to database
  async uploadPhoto(photoUpload: PhotoUpload, userId?: string): Promise<DatabasePhoto> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured')
    }

    const { file, name, size, source } = photoUpload
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `photos/${userId || 'anonymous'}/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photo-storage')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      throw new Error('Failed to upload photo')
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('photo-storage')
      .getPublicUrl(filePath)

    // Save metadata to database
    const photoData = {
      url: urlData.publicUrl,
      name,
      size,
      source,
      user_id: userId,
      status: 'active' as const,
      added_at: new Date().toISOString(),
    }

    const { data: dbData, error: dbError } = await supabase
      .from(this.tableName)
      .insert(photoData)
      .select()
      .single()

    if (dbError) {
      console.error('Error saving photo metadata:', dbError)
      throw new Error('Failed to save photo metadata')
    }

    return dbData
  }

  // Delete photo (soft delete)
  async deletePhoto(photoId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', photoId)

    if (error) {
      console.error('Error deleting photo:', error)
      throw new Error('Failed to delete photo')
    }
  }

  // Restore photo
  async restorePhoto(photoId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({
        status: 'active',
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', photoId)

    if (error) {
      console.error('Error restoring photo:', error)
      throw new Error('Failed to restore photo')
    }
  }

  // Permanently delete photo
  async permanentlyDeletePhoto(photoId: string): Promise<void> {
    // First get the photo to get the file path
    const { data: photo, error: fetchError } = await supabase
      .from(this.tableName)
      .select('url')
      .eq('id', photoId)
      .single()

    if (fetchError) {
      console.error('Error fetching photo for deletion:', fetchError)
      throw new Error('Failed to fetch photo for deletion')
    }

    // Extract file path from URL
    const urlParts = photo.url.split('/')
    const filePath = urlParts.slice(-2).join('/') // Get last two parts: photos/userId/filename

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('photo-storage')
      .remove([filePath])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', photoId)

    if (dbError) {
      console.error('Error deleting photo from database:', dbError)
      throw new Error('Failed to delete photo from database')
    }
  }

  // Clean up old deleted photos (older than 10 days)
  async cleanupOldPhotos(): Promise<void> {
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    const { data: oldPhotos, error: fetchError } = await supabase
      .from(this.tableName)
      .select('id, url')
      .eq('status', 'deleted')
      .lt('deleted_at', tenDaysAgo.toISOString())

    if (fetchError) {
      console.error('Error fetching old photos:', fetchError)
      return
    }

    if (!oldPhotos || oldPhotos.length === 0) {
      return
    }

    // Delete files from storage
    const filePaths = oldPhotos.map(photo => {
      const urlParts = photo.url.split('/')
      return urlParts.slice(-2).join('/')
    })

    const { error: storageError } = await supabase.storage
      .from('photo-storage')
      .remove(filePaths)

    if (storageError) {
      console.error('Error deleting old files from storage:', storageError)
    }

    // Delete from database
    const photoIds = oldPhotos.map(photo => photo.id)
    const { error: dbError } = await supabase
      .from(this.tableName)
      .delete()
      .in('id', photoIds)

    if (dbError) {
      console.error('Error deleting old photos from database:', dbError)
    }
  }

  // Get photos by status
  async getPhotosByStatus(status: 'active' | 'deleted', userId?: string): Promise<DatabasePhoto[]> {
    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching ${status} photos:`, error)
      throw new Error(`Failed to fetch ${status} photos`)
    }

    return data || []
  }

  // Get photos by source
  async getPhotosBySource(source: 'upload' | 'camera', userId?: string): Promise<DatabasePhoto[]> {
    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq('source', source)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching ${source} photos:`, error)
      throw new Error(`Failed to fetch ${source} photos`)
    }

    return data || []
  }
}

export const photoDB = new PhotoDatabaseService() 