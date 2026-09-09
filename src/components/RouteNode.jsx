import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { LockKeyhole, Building2, Flag, Inbox, Stamp, CheckCircle2 } from 'lucide-react'
export default function RouteNode({data}){
  const Icon=data.kind==='start'?Inbox:data.kind==='direction'?Stamp:data.kind==='end'?Flag:Building2
  return <div className={`flow-node ${data.locked?'locked':''} ${data.runtime||''}`} style={{'--node-color':data.color||'#0788d1'}}>
    {data.kind!=='start'&&<Handle type="target" position={Position.Left}/>}<div className="flow-node-icon"><Icon size={18}/></div><div><b>{data.label}</b><span>{data.subtitle}</span></div>{data.locked&&<LockKeyhole size={13} className="flow-lock"/>}{data.runtime==='done'&&<CheckCircle2 size={16} className="flow-done"/>}{data.kind!=='end'&&<Handle type="source" position={Position.Right}/>}</div>
}
