import {useState, useEffect} from "react";
import {toggleTheme, useTheme, initTheme} from "../interface/theme.store";
import {generateDeviceName} from "../interface/get-device-name";
import {sessionStorage} from "../interface/session-storage";

type JoinFormProps = {
  onJoin: ({room, user, password}: { room: string, user: string, password: string }) => void;
};

const session = sessionStorage<{ user: string }>('join-form')

function initName() {
  const user = session.get()?.user || generateDeviceName()
  session.set({user})
  return user
}

const defaultUser = initName()

export const JoinForm = ({onJoin}: JoinFormProps) => {
  const [user, setUser] = useState(defaultUser)
  const [room, setRoom] = useState('')
  const [password, setPassword] = useState('')
  const {theme} = useTheme()

  useEffect(() => {
    initTheme()
  }, [])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!room || !user) return
    session.set({user})
    onJoin({room, user, password})
  }

  const onChangeUser = (value: string) => {
    setUser(value)
    session.set({user: value})
  }

  return (
    <div className="join-container">
      <form className="join-form" onSubmit={onSubmit}>
        <div className="join-box">
          <div className="join-header">
            <div className="join-title">
              <strong>local-chat</strong> — connect
            </div>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === 'dark' ? '○' : '●'}
            </button>
          </div>
          <div className="join-body">
            <div className="join-field">
              <label className="join-label">room</label>
              <input
                className="join-input"
                value={room}
                onChange={e => setRoom(e.target.value)}
                placeholder="enter room name"
                autoFocus
              />
            </div>
            <div className="join-field">
              <label className="join-label">name</label>
              <input
                className="join-input"
                value={user}
                onChange={e => onChangeUser(e.target.value)}
                placeholder="enter your name"
              />
            </div>
            <div className="join-field">
              <label className="join-label">password <span
                className="join-hint">(optional, for E2E encryption)</span></label>
              <input
                className="join-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="encryption password"
              />
            </div>
          </div>
          <div className="join-footer">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!room || !user}
            >
              join
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
