import React from 'react'
import { Task } from '../../app/types'

// Použijeme props z desktopové verze pro obě platformy
type UnifiedTasksScreenProps = {
  tasks: Task[]
  tasksDone: number
  toggleTask: (taskId: number) => void
  addTask: () => void
  deleteTask: (taskId: number) => void
}

export function UnifiedTasksScreen({ 
  tasks, 
  tasksDone, 
  toggleTask, 
  addTask, 
  deleteTask 
}: UnifiedTasksScreenProps) {
  return (
    <section className="flex flex-col gap-6 p-4 max-w-4xl mx-auto w-full">
      
      {/* Hlavička a hlavní akce (Desktop) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold">Moje úkoly</h2>
          <p className="text-gray-500">Přehled všech úkolů a jejich stavu</p>
        </div>
        
        {/* Tlačítko pro přidání úkolu - viditelné jen na desktopu */}
        <button 
          className="hidden md:block px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
          onClick={addTask}
        >
          + Přidat úkol
        </button>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white p-3 md:p-6 rounded-xl border shadow-sm text-center">
          <div className="text-xs md:text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Celkem</div>
          <div className="text-2xl md:text-4xl font-bold text-gray-800">{tasks.length}</div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-xl border shadow-sm text-center">
          <div className="text-xs md:text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Splněno</div>
          <div className="text-2xl md:text-4xl font-bold text-emerald-600">{tasksDone}</div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-xl border shadow-sm text-center">
          <div className="text-xs md:text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Zbývá</div>
          <div className="text-2xl md:text-4xl font-bold text-blue-600">{tasks.length - tasksDone}</div>
        </div>
      </div>

      {/* Seznam úkolů */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {tasks.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <li 
                key={task.id} 
                className={`flex items-center justify-between p-4 transition-colors hover:bg-gray-50 ${task.done ? 'bg-gray-50/50' : 'bg-white'}`}
              >
                <label className="flex items-center gap-4 cursor-pointer flex-1 group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="peer w-6 h-6 border-2 border-gray-300 rounded cursor-pointer transition-colors checked:border-emerald-500 checked:bg-emerald-500 hover:border-emerald-400 focus:ring-emerald-500 focus:ring-2 focus:ring-offset-2 appearance-none"
                      checked={task.done} 
                      onChange={() => toggleTask(task.id)} 
                    />
                    {/* Vlastní zaškrtávátko SVG zobrazené při checked stavu */}
                    <svg className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={`text-base md:text-lg transition-all ${task.done ? 'line-through text-gray-400' : 'text-gray-800 font-medium group-hover:text-blue-600'}`}>
                    {task.title}
                  </span>
                </label>
                
                <button
                  onClick={() => deleteTask(task.id)}
                  className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Odstranit úkol ${task.title}`}
                  title="Odstranit úkol"
                >
                  {/* Ikona popelnice / křížku */}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <span className="text-4xl">🎉</span>
            <p className="text-lg font-medium">Zatím nejsou evidované žádné úkoly. Paráda!</p>
          </div>
        )}
      </div>

      {/* FAB: Floating Action Button pro mobil (na desktopu je skrytý) */}
      <button 
        type="button" 
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-transform z-50"
        aria-label="Přidat úkol" 
        onClick={addTask}
      >
        +
      </button>

    </section>
  )
}