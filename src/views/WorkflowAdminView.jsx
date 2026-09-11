import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge, MarkerType, useReactFlow
} from '@xyflow/react'
import {
  Workflow, Search, GripVertical, Building2, Rocket, Play,
  AlertTriangle, CheckCircle2, LockKeyhole, WandSparkles, Plus,
  Pencil, Trash2, Info, ArrowRight, Layers, Sparkles
} from 'lucide-react'
import RouteNode from '../components/RouteNode'
import { Panel, Badge } from '../components/ui'
import ProcedureFormModal from '../components/ProcedureFormModal'
import { officeName } from '../data/catalogs'
import { validateWorkflowRoute } from '../workflowEngine'

const nodeTypes = { route: RouteNode }
const edgeStyle = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#0284c7' },
  style: { stroke: '#0284c7', strokeWidth: 2.5 },
  animated: false
}
const fixedIds = ['start', 'direccion', 'end']
const fixedData = {
  start: { kind: 'start', label: 'Mesa de Partes', subtitle: 'Recepción y Registro', locked: true, color: '#0284c7' },
  direccion: { kind: 'direction', label: 'Dirección General', subtitle: 'Proveído Institucional', locked: true, color: '#091a2b' },
  end: { kind: 'end', label: 'Mesa de Partes', subtitle: 'Cierre y Notificación', locked: true, color: '#10b981' }
}

const officeData = (id, offices) => ({
  kind: 'office',
  label: officeName(id),
  subtitle: 'Paso Especializado',
  officeId: id,
  locked: false,
  color: offices.find(x => x.id === id)?.color || '#6366f1'
})

function layoutForRoute(route, offices) {
  const ids = ['start', 'direccion', ...route.map((x, i) => `office-${x}-${i}`), 'end']
  const nodes = ids.map((id, i) => {
    const isOffice = id.startsWith('office-')
    const officeId = isOffice ? route[i - 2] : null
    return {
      id,
      type: 'route',
      position: { x: 50 + i * 240, y: i % 2 ? 190 : 100 },
      data: isOffice ? officeData(officeId, offices) : fixedData[id],
      deletable: isOffice
    }
  })
  const edges = ids.slice(0, -1).map((id, i) => ({
    id: `e-${id}-${ids[i + 1]}`,
    source: id,
    target: ids[i + 1],
    ...edgeStyle,
    deletable: i !== 0
  }))
  return { nodes, edges }
}

function extractRoute(nodes, edges) {
  const startOut = edges.filter(e => e.source === 'start')
  if (startOut.length !== 1 || startOut[0].target !== 'direccion') {
    throw new Error('El paso inicial obligatorio Mesa de Partes → Dirección no puede eliminarse ni modificarse.')
  }
  const route = []
  let current = 'direccion'
  const seen = new Set([current])
  for (let guard = 0; guard < 30; guard++) {
    const outgoing = edges.filter(e => e.source === current)
    if (outgoing.length !== 1) {
      throw new Error(current === 'direccion' ? 'Dirección debe tener exactamente una salida conectada.' : 'Cada oficina debe tener una sola salida conectada.')
    }
    const next = outgoing[0].target
    if (next === 'end') {
      const officeNodes = nodes.filter(n => n.data.kind === 'office')
      if (officeNodes.length !== route.length) {
        throw new Error('Hay oficinas sin conectar en el lienzo. Conéctalas o elimínalas antes de publicar.')
      }
      return route
    }
    if (seen.has(next)) throw new Error('La ruta contiene un bucle o ciclo no permitido.')
    const node = nodes.find(n => n.id === next)
    if (!node || node.data.kind !== 'office') throw new Error('La ruta contiene un nodo no válido.')
    route.push(node.data.officeId)
    seen.add(next)
    current = next
  }
  throw new Error('No se encontró el nodo final de cierre de ruta.')
}

function Designer({ procedureId, config, offices, onPublish }) {
  const initial = useMemo(() => layoutForRoute(config.route, offices), [procedureId])
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const { screenToFlowPosition } = useReactFlow()
  const [message, setMessage] = useState('')
  const [simulation, setSimulation] = useState({ path: [], index: -1 })

  useEffect(() => {
    const x = layoutForRoute(config.route, offices)
    setNodes(x.nodes)
    setEdges(x.edges)
    setMessage('')
    setSimulation({ path: [], index: -1 })
  }, [procedureId, config.version])

  const onConnect = useCallback(
    params => setEdges(es => addEdge({ ...params, ...edgeStyle, id: `e-${Date.now()}` }, es)),
    [setEdges]
  )

  const onDrop = useCallback(
    e => {
      e.preventDefault()
      const officeId = e.dataTransfer.getData('application/arib-office')
      if (!officeId) return
      const id = `office-${officeId}-${Date.now()}`
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      setNodes(ns => [...ns, { id, type: 'route', position, data: officeData(officeId, offices), deletable: true }])
      setMessage(`${officeName(officeId)} agregado al lienzo. Conéctalo arrastrando desde el conector derecho de la oficina previa.`)
    },
    [setNodes, screenToFlowPosition, offices]
  )

  const autoArrange = () => {
    try {
      const route = extractRoute(nodes, edges)
      const x = layoutForRoute(route, offices)
      setNodes(x.nodes)
      setEdges(x.edges)
      setMessage('Ruta auto-alineada correctamente.')
    } catch (err) {
      setMessage(err.message)
    }
  }

  const publish = () => {
    try {
      const route = extractRoute(nodes, edges)
      const errs = validateWorkflowRoute(route)
      if (errs.length) throw new Error(errs[0])
      onPublish(procedureId, route)
      setMessage(`Publicada exitosamente nueva versión (v${(config.version || 1) + 1}) con ruta: ${route.map(officeName).join(' → ')}`)
    } catch (err) {
      setMessage(err.message)
    }
  }

  const simulate = () => {
    try {
      const route = extractRoute(nodes, edges)
      const path = [
        'start',
        'direccion',
        ...route.map((x, i) => nodes.find(n => n.data.officeId === x && !['start', 'direccion', 'end'].includes(n.id))?.id).filter(Boolean),
        'end'
      ]
      setSimulation({ path, index: 0 })
    } catch (err) {
      setMessage(err.message)
    }
  }

  useEffect(() => {
    if (simulation.index < 0 || simulation.index >= simulation.path.length - 1) return
    const t = setTimeout(() => setSimulation(s => ({ ...s, index: s.index + 1 })), 850)
    return () => clearTimeout(t)
  }, [simulation.index])

  const runtimeNodes = nodes.map(n => {
    const p = simulation.path.indexOf(n.id)
    const runtime = simulation.index === p ? 'active' : p >= 0 && p < simulation.index ? 'done' : ''
    return { ...n, data: { ...n.data, runtime } }
  })

  return (
    <div className="designer-layout">
      {/* Left Palette */}
      <aside className="designer-palette">
        <div className="palette-title">
          <Workflow size={18} style={{ color: 'var(--arib-primary)' }} />
          <div>
            <b>Oficinas disponibles</b>
            <span>Arrastra al lienzo de diseño</span>
          </div>
        </div>

        <div className="locked-note" style={{ background: 'var(--arib-surface-subtle)', padding: 10, borderRadius: 8, margin: '8px 0 12px' }}>
          <LockKeyhole size={14} style={{ color: 'var(--arib-navy-light)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--arib-slate)' }}>
            Mesa de Partes (Inicio/Fin) y Dirección General son nodos fijos por el marco normativo institucional.
          </span>
        </div>

        <div className="palette-office-list">
          {offices
            .filter(x => !['mesa_partes', 'direccion'].includes(x.id))
            .map(o => (
              <div
                key={o.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('application/arib-office', o.id)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                className="palette-office"
              >
                <span style={{ background: o.color }}>
                  <Building2 size={16} />
                </span>
                <b>{o.name}</b>
                <GripVertical size={15} style={{ color: 'var(--arib-navy-light)' }} />
              </div>
            ))}
        </div>

        <div className="version-card" style={{ marginTop: 'auto', background: 'var(--arib-surface-card)', border: '1px solid var(--arib-border)', borderRadius: 10, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--arib-navy-light)', textTransform: 'uppercase' }}>
              Versión Activa
            </span>
            <Badge tone="success">v{config.version || 1}</Badge>
          </div>
          <small style={{ display: 'block', marginTop: 4, color: 'var(--arib-navy-light)', fontSize: 11 }}>
            Última actualización: {config.updatedAt || 'Hoy'}
          </small>
        </div>
      </aside>

      {/* Right Canvas */}
      <div className="designer-canvas">
        <div className="designer-toolbar">
          <div>
            <b>Diseñador Visual de Recorrido</b>
            <span>Conecta secuencialmente las dependencias que evaluarán este trámite.</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn soft" onClick={autoArrange} title="Alinear nodos automáticamente">
              <WandSparkles size={15} /> Ordenar
            </button>
            <button className="btn soft" onClick={simulate} title="Simular avance paso a paso">
              <Play size={15} /> Simular
            </button>
            <button className="btn primary" onClick={publish} title="Publicar como nueva versión">
              <Rocket size={15} /> Publicar nueva versión
            </button>
          </div>
        </div>

        {message && (
          <div className={`designer-message ${message.includes('Publicada') || message.includes('auto-alineada') ? 'ok' : ''}`}>
            {message.includes('Publicada') || message.includes('auto-alineada') ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            <span>{message}</span>
          </div>
        )}

        <ReactFlow
          nodes={runtimeNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={e => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          }}
          fitView
          minZoom={0.35}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} color="#dbe7f0" />
          <Controls />
          <MiniMap nodeColor={n => n.data.color || '#94a3b8'} maskColor="rgba(248,250,252,0.8)" />
        </ReactFlow>
      </div>
    </div>
  )
}

export default function WorkflowAdminView({
  workflows,
  offices,
  procedures,
  onPublish,
  onSaveProcedure,
  onDeleteProcedure
}) {
  const [procedureId, setProcedureId] = useState(procedures[0]?.id || '')
  const [search, setSearch] = useState('')
  const [procModal, setProcModal] = useState(null)

  const list = procedures.filter(p =>
    `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())
  )
  const p = procedures.find(x => x.id === procedureId) || procedures[0]
  const config = workflows[p?.id] || { version: 1, route: [], updatedAt: 'Hoy' }

  const handleSaveProcedure = data => {
    const id = onSaveProcedure(data)
    if (id) {
      setProcedureId(id)
      setProcModal(null)
    }
  }

  const handleDeleteProcedure = (id, e) => {
    e.stopPropagation()
    onDeleteProcedure(id, () => {
      if (id === procedureId) {
        const fallback = procedures.find(x => x.id !== id)
        if (fallback) setProcedureId(fallback.id)
      }
    })
  }

  return (
    <div className="role-page">
      {/* Hero Header */}
      <div className="hero-row">
        <div>
          <span className="eyebrow">ADMINISTRACIÓN DE PROCESOS</span>
          <h1>Catálogo de Trámites y Diseñador de Rutas</h1>
          <p>
            Define qué oficinas atienden cada solicitud después del proveído de Dirección General, asegurando trazabilidad y cumplimiento de SLAs.
          </p>
        </div>
        <Badge tone="success">Workflow Configurable v2.0</Badge>
      </div>

      {/* Two Column Layout: Procedure Catalog + Visual Designer */}
      <div className="workflow-admin-grid">
        {/* Left: Procedure Selector & Creator */}
        <Panel
          title="Tipos de trámite"
          subtitle={`${procedures.length} trámites configurados`}
          actions={
            <div className="search-mini">
              <Search size={15} />
              <input
                placeholder="Buscar trámite…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          }
        >
          <button
            className="btn soft full"
            style={{ marginBottom: 12, justifyContent: 'center' }}
            onClick={() => setProcModal({})}
          >
            <Plus size={16} /> Crear nuevo trámite
          </button>

          <div className="procedure-list">
            {list.map(x => (
              <button
                key={x.id}
                className={procedureId === x.id ? 'active' : ''}
                onClick={() => setProcedureId(x.id)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ color: 'var(--arib-navy)', fontSize: 13 }}>{x.name}</b>
                  <span style={{ fontSize: 12, color: 'var(--arib-navy-light)' }}>
                    {x.category} · SLA <strong>{x.sla}d</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <Badge tone="neutral">v{workflows[x.id]?.version || 1}</Badge>
                  <span
                    className="btn ghost"
                    style={{ padding: '4px 6px' }}
                    onClick={e => {
                      e.stopPropagation()
                      setProcModal({ ...x })
                    }}
                    title="Editar datos del trámite"
                  >
                    <Pencil size={12} />
                  </span>
                  <span
                    className="btn danger-soft"
                    style={{ padding: '4px 6px' }}
                    onClick={e => handleDeleteProcedure(x.id, e)}
                    title="Eliminar trámite"
                  >
                    <Trash2 size={12} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        {/* Right: Selected Procedure & Flow Designer */}
        <Panel
          title={p ? p.name : 'Trámite'}
          subtitle={p?.requires ? `Requisitos normativos: ${p.requires}` : 'Configuración de ruta oficial'}
        >
          {p ? (
            <>
              {/* Published Route Preview */}
              <div className="published-route" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--arib-navy-light)' }}>
                    Ruta canónica en producción:
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--arib-navy-light)' }}>
                    SLA oficial: <b>{p.sla} días hábiles</b>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <b style={{ color: 'var(--arib-primary)' }}>Mesa de Partes</b>
                  <i style={{ fontStyle: 'normal', color: 'var(--arib-navy-light)' }}>→</i>
                  <b style={{ color: 'var(--arib-navy)' }}>Dirección General</b>
                  {config.route.map(id => (
                    <React.Fragment key={id}>
                      <i style={{ fontStyle: 'normal', color: 'var(--arib-navy-light)' }}>→</i>
                      <b style={{ color: offices.find(o => o.id === id)?.color || 'var(--arib-primary)' }}>
                        {officeName(id)}
                      </b>
                    </React.Fragment>
                  ))}
                  <i style={{ fontStyle: 'normal', color: 'var(--arib-navy-light)' }}>→</i>
                  <b style={{ color: 'var(--arib-success)' }}>Cierre y Entrega</b>
                </div>
              </div>

              {/* ReactFlow Canvas */}
              <ReactFlowProvider>
                <Designer
                  procedureId={p.id}
                  config={config}
                  offices={offices}
                  onPublish={onPublish}
                />
              </ReactFlowProvider>
            </>
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--arib-navy-light)' }}>
              Selecciona o crea un trámite para diseñar su flujo.
            </div>
          )}
        </Panel>
      </div>

      {/* Modal for Creating / Editing Procedure */}
      {procModal && (
        <ProcedureFormModal
          procedure={procModal}
          offices={offices}
          onClose={() => setProcModal(null)}
          onSave={handleSaveProcedure}
        />
      )}
    </div>
  )
}

