export type AuthorizedAboutVisual = {
  kind: 'authorized'
  sources: {
    wideAvif: string
    wideWebp: string
    wideJpeg: string
    portraitAvif: string
    portraitWebp: string
    portraitJpeg: string
  }
  dimensions: {
    wide: { width: number; height: number }
    portrait: { width: number; height: number }
  }
  alt: string
  credit?: string
  authorization: {
    source: string
    publicationRights: string
    transformationPermission: string
    creditRequirement: string
    evidenceReference: string
  }
}

export type AboutVisual =
  | { kind: 'placeholder'; message: string }
  | AuthorizedAboutVisual

/**
 * Replace only after source, publication rights, transformation permission,
 * credit requirements, and authorization evidence have been verified.
 */
export const aboutVisual: AboutVisual = {
  kind: 'placeholder',
  message: 'Imagen institucional pendiente de autorización.',
}
