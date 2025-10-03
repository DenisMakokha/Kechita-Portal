import { create } from 'zustand';
import axios from 'axios';

type User = { id:string; email:string; firstName:string; lastName:string; role:string } | null;

type State = {
  user: User;
  loading: boolean;
  login: (email:string, password:string)=>Promise<void>;
  logout: ()=>void;
  fetchMe: ()=>Promise<void>;
};

export const useAuth = create<State>((set)=> ({
  user: null,
  loading: false,
  login: async (email, password) => {
    set({ loading: true });
    try {
      await axios.post('http://localhost:4000/auth/login', { email, password }, { withCredentials: true });
      await axios.get('http://localhost:4000/auth/me', { withCredentials: true }).then(r=> set({ user: r.data }));
    } finally {
      set({ loading: false });
    }
  },
  logout: () => { set({ user: null }); },
  fetchMe: async () => {
    try {
      const r = await axios.get('http://localhost:4000/auth/me', { withCredentials: true });
      set({ user: r.data });
    } catch {}
  }
}));
