import { seedExpedientes, seedWorkflowConfigs, seedUsers } from '../data/seed'
import { DEFAULT_OFFICES, DEFAULT_PROCEDURES } from '../data/catalogs'
const K_EXP='arib-master-expedientes-v1'
const K_WF='arib-master-workflows-v1'
const K_OFFICES='arib-master-offices-v1'
const K_PROCEDURES='arib-master-procedures-v1'
const K_USERS='arib-master-users-v1'
const clone=x=>JSON.parse(JSON.stringify(x))
export function loadExpedientes(){try{return JSON.parse(localStorage.getItem(K_EXP))||clone(seedExpedientes)}catch{return clone(seedExpedientes)}}
export function saveExpedientes(v){try{localStorage.setItem(K_EXP,JSON.stringify(v))}catch{}}
export function loadWorkflows(){try{return JSON.parse(localStorage.getItem(K_WF))||clone(seedWorkflowConfigs)}catch{return clone(seedWorkflowConfigs)}}
export function saveWorkflows(v){try{localStorage.setItem(K_WF,JSON.stringify(v))}catch{}}
export function loadOffices(){try{return JSON.parse(localStorage.getItem(K_OFFICES))||clone(DEFAULT_OFFICES)}catch{return clone(DEFAULT_OFFICES)}}
export function saveOffices(v){try{localStorage.setItem(K_OFFICES,JSON.stringify(v))}catch{}}
export function loadProcedures(){try{return JSON.parse(localStorage.getItem(K_PROCEDURES))||clone(DEFAULT_PROCEDURES)}catch{return clone(DEFAULT_PROCEDURES)}}
export function saveProcedures(v){try{localStorage.setItem(K_PROCEDURES,JSON.stringify(v))}catch{}}
export function loadUsers(){try{return JSON.parse(localStorage.getItem(K_USERS))||clone(seedUsers)}catch{return clone(seedUsers)}}
export function saveUsers(v){try{localStorage.setItem(K_USERS,JSON.stringify(v))}catch{}}
export function resetAll(){try{localStorage.removeItem(K_EXP);localStorage.removeItem(K_WF);localStorage.removeItem(K_OFFICES);localStorage.removeItem(K_PROCEDURES);localStorage.removeItem(K_USERS)}catch{};return {expedientes:clone(seedExpedientes),workflows:clone(seedWorkflowConfigs),offices:clone(DEFAULT_OFFICES),procedures:clone(DEFAULT_PROCEDURES),users:clone(seedUsers)}}
export function nextNumero(items){return Math.max(5222,...items.map(x=>Number(x.numero)||0))+1}
