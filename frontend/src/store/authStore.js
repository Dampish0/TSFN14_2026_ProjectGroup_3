import {create } from 'zustand';
import axios from 'axios';
import { getApiURL } from './apiURL';

const apiURL =  getApiURL('/api/auth');
axios.defaults.withCredentials = true;
const mockuser = {
  "_id": { "$oid": "69ada9b8140f0fcb7cb10b57" },
  "email": "testuser@example.com",
  "password": "$2b$14$J.U4q.5KZXL6C5DY.a.yj.9dfleKgs5d4v2Xp47n.YKkGPcr.hEP6",
  "name": "Samsom",
  "lastLogin": { "$date": "2026-03-08T12:00:00Z" },
  "role": "admin",
  "refereeId": null,
  "clubId": { "$oid": "69ada9b8140f0fcb7cb10b58" },
  "resetPasswordToken": null,
  "resetPasswordExpiresAt": null,
  "actions": [
    {
      "type": "login",
      "date": { "$date": "2026-03-08T12:00:00Z" },
      "description": "User logged in"
    }
  ],
  "notifications": [
    {
      "title": "Welcome",
      "message": "Welcome to the platform!",
      "date": { "$date": "2026-03-08T12:00:00Z" },
      "read": false
    }
  ],
  "adminCases": [],
  "createdAt": { "$date": "2026-03-08T12:00:00Z" },
  "updatedAt": { "$date": "2026-03-08T12:00:00Z" }
}
export const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    error: null,
    loading: false,
    isCheckingAuth: true,

    register: async (name, email, authRole) => {
        set({loading: true, error: null});
        try {
            const response = await axios.post(`${apiURL}/createuser`, {name, email, authRole}, {withCredentials: true});
            set({user: response.data.user, isAuthenticated: true, loading: false});
        } catch (error) {
            set({error: error.response?.data?.message || "Misslyckades att registrerar", loading: false});
            throw error;
        } 
    },

    login: async (email, password) => {
        set({loading: true, error: null});
        try {
            // const response = await axios.post(`${apiURL}/login`, {email, password}, {withCredentials: true});
            // if(response.data.success === false){
            //     set({error: response.data.message, loading: false, isAuthenticated: false, user: null});
            //     return;
            // }  // const checkAuth = false;
  // const isAuthenticated = true;
  // const user = mockuser;
            set({user: mockuser, isAuthenticated: true, error: null, loading: false});
        } catch (error) {
            set({error: error.response?.data?.message || "Misslyckades att logga in", loading: false});
            throw error;
        }
    },
    logout: async () => {
        set({loading: true, error: null});
        try {
            await axios.post(`${apiURL}/logout`, {}, {withCredentials: true});
            set({user: null, isAuthenticated: false, loading: false});
        } catch (error) {
            set({error: error.response?.data?.message || "Misslyckades att logga ut", loading: false});
            throw error;
        }
    },
    checkAuth: async () => {
        set({isCheckingAuth: true, error: null});
        try {
            const response = await axios.get(`${apiURL}/check-auth`, {withCredentials: true});
            if(response.data.success === false){
                set({user: null, isAuthenticated: false, isCheckingAuth: false});
                return;
            }
            set({user: response.data.user, isAuthenticated: true, isCheckingAuth: false});
        } catch (error) {
            set({user: null, isAuthenticated: false, isCheckingAuth: false, error: null});
        }
    },

    sendPassResetRequest: async (email) => {
        set({loading: true, error: null});
        try {
            await axios.post(`${apiURL}/forgotpass`, {email: email}, {withCredentials: true});
            set({loading: false});
        } catch (error) {
            set({error: error.response?.data?.message || "Misslyckades att skicka återställningslänk", loading: false});
            throw error;
        }
    },

    resetPassword: async (token, newPassword) => {
        set({loading: true, error: null});
        try {
            await axios.post(`${apiURL}/resetpass/${token}`, {password: newPassword}, {withCredentials: true});
            set({loading: false});
        } catch (error) {
            set({error: error.response?.data?.message || "Misslyckades att återställa lösenord", loading: false});
            throw error;
        }
    },

    verifyRole: async (role) => {
        set({loading: true, error: null});
        try {
            const response = await axios.post(`${apiURL}/verify-role`, {role}, {withCredentials: true});
            if(response.data.success === false){
                set({error: response.data.message, loading: false});
                return;
            }
            set({loading: false});
        } catch (error) {
            set({error: error.response?.data?.message || "Misslyckades att verifiera roll", loading: false});
            throw error;
        }
    },

    sendNotification: async (title, message, group, userId, clubId) => {
        set({loading: true, error: null});
        try {
            const response = await axios.post(`${apiURL}/notify`, {title, message, group, userId, clubId}, {withCredentials: true});
            if(response.data.success === false){
                set({error: response.data.message, loading: false});
                return;
            }
            set({loading: false});
        } catch (error) {
            set({error: error.response?.data?.message || "Misslyckades att skicka meddelande", loading: false});
            throw error;
        }
    },

    markNotificationsAsRead: async (notificationIds) => {
        set({loading: true, error: null});
        try {
            const response = await axios.post(`${apiURL}/notify/mark-read`, {notificationIds}, {withCredentials: true});
            if(response.data.success === false){
                set({error: response.data.message, loading: false});
                return;
            }
            set({loading: false});
        } catch (error) {
            set({error: error.response?.data?.message || "Misslyckades att markera meddelande som läst", loading: false});
            throw error;
        }
    }

}));

export default useAuthStore;