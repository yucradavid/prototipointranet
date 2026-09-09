const HEADERS=['Nombre y Apellido','DNI','Codigo','Anio Ingreso','Carrera']
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'')
const csvRow=cols=>cols.map(v=>`"${String(v||'').replaceAll('"','""')}"`).join(',')

export function buildStudentsTemplateCsv(){
  const rows=[HEADERS,['Juan Perez Quispe','70223344','2023100045','2023','Arquitectura de Plataformas y Servicios de TI']]
  return rows.map(csvRow).join('\r\n')
}

function parseCsvLine(line){
  const out=[];let cur='';let inQ=false
  for(let i=0;i<line.length;i++){
    const c=line[i]
    if(inQ){
      if(c==='"'){ if(line[i+1]==='"'){cur+='"';i++} else inQ=false }
      else cur+=c
    } else {
      if(c==='"') inQ=true
      else if(c===','){out.push(cur);cur=''}
      else cur+=c
    }
  }
  out.push(cur)
  return out
}

export function parseStudentsCsv(text){
  const lines=String(text||'').split(/\r?\n/).filter(l=>l.trim().length)
  if(!lines.length) return {rows:[],errors:['El archivo está vacío.']}
  const header=parseCsvLine(lines[0]).map(norm)
  const idx={
    nombre:header.findIndex(h=>h.includes('nombre')),
    dni:header.findIndex(h=>h==='dni'),
    codigo:header.findIndex(h=>h.includes('codigo')),
    anio:header.findIndex(h=>h.includes('anio')),
    carrera:header.findIndex(h=>h.includes('carrera')),
  }
  const useHeader=idx.nombre>=0&&idx.dni>=0&&idx.codigo>=0
  const dataLines=useHeader?lines.slice(1):lines
  const rows=[];const errors=[]
  dataLines.forEach((line,i)=>{
    const cols=parseCsvLine(line)
    const get=(key,posFallback)=>useHeader&&idx[key]>=0?cols[idx[key]]:cols[posFallback]
    const fullName=(get('nombre',0)||'').trim()
    const dni=(get('dni',1)||'').trim()
    const codigo=(get('codigo',2)||'').trim()
    const anioIngreso=(get('anio',3)||'').trim()
    const carrera=(get('carrera',4)||'').trim()
    const rowNum=i+(useHeader?2:1)
    if(!fullName||!dni||!codigo){errors.push(`Fila ${rowNum}: faltan datos obligatorios (nombre, DNI o código).`);return}
    rows.push({fullName,dni,codigo,anioIngreso,carrera})
  })
  return {rows,errors}
}

export function buildCredentialsCsv(users){
  const header=['Nombre y Apellido','Usuario','Contraseña','Código','Carrera']
  const data=users.map(u=>[u.fullName,u.username,u.password,u.codigo,u.carrera])
  return [header,...data].map(csvRow).join('\r\n')
}
