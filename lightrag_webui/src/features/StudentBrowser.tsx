import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, FileText, Headphones, User, Folder, FolderOpen } from 'lucide-react'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileItem[]
}

interface Student {
  name: string
  path: string
  files: FileItem[]
}

export default function StudentBrowser() {
  const [students, setStudents] = useState<Student[]>([])
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  useEffect(() => {
    fetch('/student-folders')
      .then(res => res.json())
      .then(data => {
        setStudents(data.students || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggleStudent = (name: string) => {
    setExpandedStudents(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const getFileIcon = (name: string) => {
    if (name.endsWith('.m4a') || name.endsWith('.mp3') || name.endsWith('.wav')) {
      return <Headphones size={12} className="text-blue-400" />
    }
    return <FileText size={12} className="text-emerald-400" />
  }

  const renderFileTree = (items: FileItem[], depth: number = 0) => {
    return items.map(item => {
      const isExpanded = expandedFolders.has(item.path)
      const paddingLeft = `${(depth + 1) * 12 + 24}px`

      if (item.type === 'folder') {
        return (
          <div key={item.path}>
            <button
              onClick={() => toggleFolder(item.path)}
              className="w-full flex items-center gap-1.5 px-2 py-0.5 text-xs hover:bg-sidebar-accent rounded text-left"
              style={{ paddingLeft }}
            >
              {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              {isExpanded ? <FolderOpen size={12} className="text-amber-400" /> : <Folder size={12} className="text-amber-400" />}
              <span className="truncate">{item.name}</span>
            </button>
            {isExpanded && item.children && renderFileTree(item.children, depth + 1)}
          </div>
        )
      }

      return (
        <button
          key={item.path}
          onClick={() => setSelectedFile(item.path)}
          className={`w-full flex items-center gap-1.5 px-2 py-0.5 text-xs hover:bg-sidebar-accent rounded text-left ${selectedFile === item.path ? 'bg-sidebar-accent' : ''}`}
          style={{ paddingLeft }}
        >
          <span className="w-3.5" />
          {getFileIcon(item.name)}
          <span className="truncate text-muted-foreground">{item.name}</span>
        </button>
      )
    })
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading folders...</div>
  }

  if (!students.length) {
    return <div className="p-4 text-sm text-muted-foreground">No students found</div>
  }

  return (
    <div className="w-72 h-full border-r bg-sidebar text-sidebar-foreground overflow-auto flex flex-col">
      <div className="p-3 font-medium text-sm border-b">
        By Student
        <div className="text-xs text-muted-foreground mt-1">
          {students.length} students
        </div>
      </div>

      <div className="flex-1 overflow-auto py-1">
        {students.map(student => (
          <div key={student.name}>
            <button
              onClick={() => toggleStudent(student.name)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-sidebar-accent rounded text-left"
            >
              {expandedStudents.has(student.name) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <User size={14} />
              <span className="flex-1 truncate">{student.name}</span>
            </button>

            {expandedStudents.has(student.name) && student.files.length > 0 && (
              <div className="py-0.5">
                {renderFileTree(student.files, 0)}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedFile && (
        <div className="p-2 border-t text-xs text-muted-foreground truncate">
          {selectedFile.split('/').pop()}
        </div>
      )}
    </div>
  )
}
