import type { ReactNode } from 'react'
const labels:Record<string,string>={PENDING:'Pendiente',APPROVED:'Aprobada',REJECTED:'Rechazada',ACTIVE:'Activa',INACTIVE:'Inactiva',SCHEDULED:'Programada',COMPLETED:'Completada',CANCELLED:'Cancelada',PRESENT:'Presente',ABSENT:'Ausente',JUSTIFIED:'Justificada',RESOLVED:'Resuelta',REVOKED:'Revocada'}
export function StatusBadge({status}:{status:string}){const good=['ACTIVE','APPROVED','PRESENT','COMPLETED'].includes(status);const warn=['PENDING','SCHEDULED','JUSTIFIED'].includes(status);return <span className={`badge ${good?'success':warn?'warning':'neutral'}`}>{labels[status]??status}</span>}
export function MetricCard({label,value,detail}:{label:string;value:ReactNode;detail?:string}){return <article className="metric-card"><span>{label}</span><strong>{value}</strong>{detail&&<small>{detail}</small>}</article>}
// oxlint-disable-next-line react/only-export-components -- formatting helper colocated with display primitives
export const date=(value:string)=>new Date(value).toLocaleDateString('es-CR')
// oxlint-disable-next-line react/only-export-components -- formatting helper colocated with display primitives
export const dateTime=(value:string)=>new Date(value).toLocaleString('es-CR')
