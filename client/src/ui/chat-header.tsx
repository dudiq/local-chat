import {handleExit} from "../interface/handle-exit";
import {toggleTheme, useTheme} from "../interface/theme.store";
import {useChatStore} from "../interface/chat.store";

export function ChatHeader(){
  const {theme} = useTheme()
  const {room, users} = useChatStore()

  return (
    <div className="terminal-header">
      <div className="terminal-title">
        <strong>local-chat</strong>
        <span>~/{room}</span>
      </div>
      <div className="terminal-actions">
        <div className="status-bar">
          <div className="status-item">
            <span className="status-dot"/>
            <span className="status-users">{users.length} online</span>
          </div>
          <span>{users.join(', ')}</span>
        </div>
        <button className="btn" onClick={handleExit} title="Leave room">
          exit
        </button>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '○' : '●'}
        </button>
      </div>
    </div>
  )
}
