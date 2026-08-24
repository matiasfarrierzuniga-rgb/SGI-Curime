import { Outlet } from 'react-router-dom'
import { PublicFooter, PublicHeader } from '@/features/public-site'
export function PublicLayout() { return <><a className="skip-link" href="#public-content">Saltar al contenido</a><PublicHeader /><main id="public-content"><Outlet /></main><PublicFooter /></> }
