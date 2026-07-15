import type { ImageSource } from '../types'
import { wikimediaSource } from './wikimedia'
import { openverseSource } from './openverse'

// Register searchable sources here. Future OAuth connectors (Pinterest,
// Instagram) implement the same ImageSource interface and drop in.
export const SEARCH_SOURCES: ImageSource[] = [wikimediaSource, openverseSource]

export { wikimediaSource, openverseSource }
