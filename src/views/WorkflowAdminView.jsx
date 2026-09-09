import React,{useCallback,useEffect,useMemo,useState} from 'react'
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, MarkerType, useReactFlow } from '@xyflow/react'
import { Workflow, Search, GripVertical, Building2, Rocket, Play, AlertTriangle, CheckCircle2, LockKeyhole, WandSparkles, Plus, Pencil, Trash2 } from 'lucide-react'
import RouteNode from '../components/RouteNode'
import { Panel, Badge } from '../components/ui'
import ProcedureFormModal from '../components/ProcedureFormModal'
import { officeName } from '../data/catalogs'
import { validateWorkflowRoute } from '../workflowEngine'

const nodeTypes={route:RouteNode}
const edgeStyle={type:'smoothstep',markerEnd:{type:MarkerType.ArrowClosed},style:{stroke:'#9bb3c7',strokeWidth:2},animated:false}
const fixedIds=['start','direccion','end']
const fixedData={start:{kind:'start',label:'Mesa de Partes',subtitle:'Registro obligatorio',locked:true,color:'#0788d1'},direccion:{kind:'direction',label:'Dirección',subtitle:'Proveído obligatorio',locked:true,color:'#111827'},end:{kind:'end',label:'Mesa de Partes',subtitle:'Entrega y cierre',locked:true,color:'#22c55e'}}
const officeData=(id,offices)=>({kind:'office',label:officeName(id),subtitle:'Paso de atención',officeId:id,locked:false,color:offices.find(x=>x.id===id)?.color||'#8b5cf6'})
function layoutForRoute(route,offices){
  const ids=['start','direccion',...route.map((x,i)=>`office-${x}-${i}`),'end']
  const nodes=ids.map((id,i)=>{const isOffice=id.startsWith('office-');const officeId=isOffice?route[i-2]:null;return {id,type:'route',position:{x:40+i*230,y:i%2?185:95},data:isOffice?officeData(officeId,offices):fixedData[id],deletable:isOffice}})
  const edges=ids.slice(0,-1).map((id,i)=>({id:`e-${id}-${ids[i+1]}`,source:id,target:ids[i+1],...edgeStyle,deletable:i!==0}))
  return {nodes,edges}
}
function extractRoute(nodes,edges){
  const startOut=edges.filter(e=>e.source==='start')
  if(startOut.length!==1||startOut[0].target!=='direccion')throw new Error('El paso obligatorio Mesa de Partes → Dirección no puede modificarse.')
  const route=[];let current='direccion';const seen=new Set([current])
  for(let guard=0;guard<30;guard++){
    const outgoing=edges.filter(e=>e.source===current)
    if(outgoing.length!==1)throw new Error(current==='direccion'?'Dirección debe tener una sola salida.':'Cada paso debe tener una sola salida.')
    const next=outgoing[0].target;if(next==='end'){const officeNodes=nodes.filter(n=>n.data.kind==='office');if(officeNodes.length!==route.length)throw new Error('Hay oficinas sin conectar en el lienzo. Conéctalas o elimínalas antes de publicar.');return route}if(seen.has(next))throw new Error('La ruta contiene un ciclo.')
    const node=nodes.find(n=>n.id===next);if(!node||node.data.kind!=='office')throw new Error('La ruta contiene un nodo no válido.')
    route.push(node.data.officeId);seen.add(next);current=next
  }
  throw new Error('No se encontró el cierre de la ruta.')
}
function Designer({procedureId,config,offices,onPublish}){
  const initial=useMemo(()=>layoutForRoute(config.route,offices),[procedureId])
  const [nodes,setNodes,onNodesChange]=useNodesState(initial.nodes),[edges,setEdges,onEdgesChange]=useEdgesState(initial.edges)
  const {screenToFlowPosition}=useReactFlow()
  const [message,setMessage]=useState(''),[simulation,setSimulation]=useState({path:[],index:-1})
  useEffect(()=>{const x=layoutForRoute(config.route,offices);setNodes(x.nodes);setEdges(x.edges);setMessage('');setSimulation({path:[],index:-1})},[procedureId,config.version])
  const onConnect=useCallback(params=>setEdges(es=>addEdge({...params,...edgeStyle,id:`e-${Date.now()}`},es)),[setEdges])
  const onDrop=useCallback(e=>{e.preventDefault();const officeId=e.dataTransfer.getData('application/arib-office');if(!officeId)return;const id=`office-${officeId}-${Date.now()}`;const position=screenToFlowPosition({x:e.clientX,y:e.clientY});setNodes(ns=>[...ns,{id,type:'route',position,data:officeData(officeId,offices),deletable:true}]);setMessage(`${officeName(officeId)} agregado. Conéctalo usando los puntos laterales.`)},[setNodes,screenToFlowPosition,offices])
  const autoArrange=()=>{try{const route=extractRoute(nodes,edges);const x=layoutForRoute(route,offices);setNodes(x.nodes);setEdges(x.edges);setMessage('Ruta auto-ordenada.') }catch(err){setMessage(err.message)}}
  const publish=()=>{try{const route=extractRoute(nodes,edges);const errs=validateWorkflowRoute(route);if(errs.length)throw new Error(errs[0]);onPublish(procedureId,route);setMessage(`Publicada nueva versión con ruta: ${route.map(officeName).join(' → ')}`)}catch(err){setMessage(err.message)}}
  const simulate=()=>{try{const route=extractRoute(nodes,edges);const path=['start','direccion',...route.map((x,i)=>nodes.find(n=>n.data.officeId===x && !['start','direccion','end'].includes(n.id))?.id).filter(Boolean),'end'];setSimulation({path,index:0})}catch(err){setMessage(err.message)}}
  useEffect(()=>{if(simulation.index<0||simulation.index>=simulation.path.length-1)return;const t=setTimeout(()=>setSimulation(s=>({...s,index:s.index+1})),800);return()=>clearTimeout(t)},[simulation.index])
  const runtimeNodes=nodes.map(n=>{const p=simulation.path.indexOf(n.id),runtime=simulation.index===p?'active':p>=0&&p<simulation.index?'done':'';return {...n,data:{...n.data,runtime}}})
  return <div className="designer-layout"><aside className="designer-palette"><div className="palette-title"><Workflow size={18}/><div><b>Oficinas disponibles</b><span>Arrastra al lienzo</span></div></div><div className="locked-note"><LockKeyhole size={15}/><span>Mesa de Partes y Dirección están bloqueados por el requerimiento.</span></div><div className="palette-office-list">{offices.filter(x=>!['mesa_partes','direccion'].includes(x.id)).map(o=><div key={o.id} draggable onDragStart={e=>{e.dataTransfer.setData('application/arib-office',o.id);e.dataTransfer.effectAllowed='move'}} className="palette-office"><span style={{background:o.color}}><Building2 size={16}/></span><b>{o.name}</b><GripVertical size={15}/></div>)}</div><div className="version-card"><span>Versión publicada</span><b>v{config.version}</b><small>{config.updatedAt}</small></div></aside>
    <div className="designer-canvas"><div className="designer-toolbar"><div><b>Ruta visual</b><span>Conecta las oficinas en el orden de atención.</span></div><div><button className="btn soft" onClick={autoArrange}><WandSparkles size={15}/> Ordenar</button><button className="btn soft" onClick={simulate}><Play size={15}/> Simular</button><button className="btn primary" onClick={publish}><Rocket size={15}/> Publicar nueva versión</button></div></div>{message&&<div className={`designer-message ${message.includes('Publicada')?'ok':''}`}>{message.includes('Publicada')?<CheckCircle2 size={16}/>:<AlertTriangle size={16}/>} {message}</div>}<ReactFlow nodes={runtimeNodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onDrop={onDrop} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect='move'}} fitView minZoom={.4} maxZoom={1.5} proOptions={{hideAttribution:true}}><Background gap={22} color="#dbe7f0"/><Controls/><MiniMap nodeColor={n=>n.data.color||'#94a3b8'} maskColor="rgba(248,250,252,.75)"/></ReactFlow></div></div>
}

export default function WorkflowAdminView({workflows,offices,procedures,onPublish,onSaveProcedure,onDeleteProcedure}){
  const [procedureId,setProcedureId]=useState(procedures[0].id),[search,setSearch]=useState('')
  const [procModal,setProcModal]=useState(null)
  const list=procedures.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))
  const p=procedures.find(x=>x.id===procedureId)||procedures[0]
  const config=workflows[p.id]
  const handleSaveProcedure=data=>{const id=onSaveProcedure(data);if(id){setProcedureId(id);setProcModal(null)}}
  const handleDeleteProcedure=(id,e)=>{e.stopPropagation();const ok=onDeleteProcedure(id);if(ok&&id===procedureId){const fallback=procedures.find(x=>x.id!==id);if(fallback)setProcedureId(fallback.id)}}
  return <div className="role-page"><div className="hero-row"><div><span className="eyebrow">ADMINISTRACIÓN DE PROCESOS</span><h1>Trámites y rutas de atención</h1><p>Controla por qué oficinas debe pasar cada tipo de trámite después del proveído de Dirección.</p></div><Badge tone="success">Workflow configurable</Badge></div>
    <div className="workflow-admin-grid"><Panel title="Tipos de trámite" actions={<div className="search-mini"><Search size={15}/><input placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)}/></div>}><div className="procedure-list">
      <button className="btn soft full" onClick={()=>setProcModal({})}><Plus size={14}/> Nuevo trámite</button>
      {list.map(x=><button key={x.id} className={procedureId===x.id?'active':''} onClick={()=>setProcedureId(x.id)}><div><b>{x.name}</b><span>{x.category} · SLA {x.sla} días</span></div><div style={{display:'flex',gap:4,alignItems:'center'}}><Badge tone="neutral">v{workflows[x.id]?.version||1}</Badge><span className="btn ghost" style={{padding:'4px 6px'}} onClick={e=>{e.stopPropagation();setProcModal({...x})}}><Pencil size={12}/></span><span className="btn danger-soft" style={{padding:'4px 6px'}} onClick={e=>handleDeleteProcedure(x.id,e)}><Trash2 size={12}/></span></div></button>)}
    </div></Panel><Panel title={p.name} subtitle={`Requisito referencial: ${p.requires}`}><div className="published-route"><span>Ruta publicada actual</span><div><b>Mesa de Partes</b><i>→</i><b>Dirección</b>{config.route.map(id=><React.Fragment key={id}><i>→</i><b>{officeName(id)}</b></React.Fragment>)}<i>→</i><b>Cierre</b></div></div><ReactFlowProvider><Designer procedureId={p.id} config={config} offices={offices} onPublish={onPublish}/></ReactFlowProvider></Panel></div>
    {procModal&&<ProcedureFormModal procedure={procModal} offices={offices} onClose={()=>setProcModal(null)} onSave={handleSaveProcedure}/>}
  </div>
}
