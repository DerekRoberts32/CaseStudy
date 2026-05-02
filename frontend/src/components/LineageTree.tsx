import { useNavigate } from 'react-router-dom'
import type { LineageNode } from '../types'

interface Props {
  node: LineageNode
  isRoot?: boolean
  currentSignalId?: string
}

export default function LineageTree({ node, isRoot = true, currentSignalId }: Props) {
  const navigate = useNavigate()
  const isRedacted = node.id === 'redacted'
  const isCurrent = node.id === currentSignalId

  return (
    <div className={`flex flex-col ${isRoot ? '' : 'ml-6 border-l border-border pl-4 mt-2'}`}>
      <div
        onClick={() => !isRedacted && !isCurrent && navigate(`/signals/${node.id}`)}
        className={`
          flex items-center gap-2 py-1.5 px-2 rounded text-sm group
          ${isRedacted ? 'cursor-default opacity-40' : isCurrent ? 'cursor-default' : 'cursor-pointer hover:bg-muted'}
          ${isCurrent ? 'bg-accent-dim border border-accent/30' : ''}
          transition-colors duration-150
        `}
      >
        <span className={`font-mono text-xs ${
          node.visibility === 'golden' ? 'text-accent' :
          node.visibility === 'shared' ? 'text-blue-400' :
          'text-text-dim'
        }`}>
          {node.visibility === 'golden' ? '★' :
           node.visibility === 'shared' ? '◈' :
           node.visibility === 'private' ? '◉' : '○'}
        </span>
        <span className={`font-mono text-xs ${
          isCurrent ? 'text-accent font-medium' :
          isRedacted ? 'text-text-dim italic' :
          'text-text-secondary group-hover:text-text-primary'
        }`}>
          {node.name}
        </span>
        {isCurrent && (
          <span className="font-mono text-[10px] text-accent border border-accent/30
                           px-1 py-0.5 rounded-sm ml-1">
            YOU ARE HERE
          </span>
        )}
        {!isRedacted && (
          <span className={`font-mono text-[10px] ml-auto px-1.5 py-0.5 rounded-sm border ${
            node.status === 'active' ? 'border-accent/30 text-accent/70' :
            node.status === 'deprecated' ? 'border-danger/30 text-danger/60' :
            'border-border text-text-dim'
          }`}>
            {node.status}
          </span>
        )}
      </div>

      {node.children.length > 0 && (
        <div>
          {node.children.map((child, i) => (
            <LineageTree
              key={`${child.id}-${i}`}
              node={child}
              isRoot={false}
              currentSignalId={currentSignalId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
