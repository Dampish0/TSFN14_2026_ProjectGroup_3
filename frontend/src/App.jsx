import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router'; 
import '@fontsource/roboto/500.css';
import Backdrop from '@mui/material/Backdrop'; 


import { Toaster } from 'react-hot-toast';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CircularProgress } from '@mui/material';
import useAuthStore from './store/authStore';
import {standardRoutes, adminRoutes, refereeRoutes, trainerRoutes

 } from './routes';
import { useState } from 'react';


const theme = createTheme({
    components: {
    // ...existing code...
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: 'white',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
        },
        input: { color: 'white' },
        notchedOutline: { borderColor: 'white' },
      },
    },
    // Add this for MUI X pickers
    MuiPickersTextField: {
      styleOverrides: {
        root: {
          color: 'white',
          '& .MuiInputLabel-root': { color: 'white' },
          '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
          '& .MuiSvgIcon-root': { color: 'white' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white',
          },
        },
      },
    }, 
  },
  typography: {
    fontFamily: 'Roboto', 
  },
});

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

export const App = () => {
  const { isCheckingAuth, checkAuth, isAuthenticated, user} = useAuthStore();
  const role = "admin"; // user?.role || "guest";

  const [_, forceUpdate] = useState(0);
  // const checkAuth = false;
  // const isAuthenticated = true;
  // const user = mockuser;
  // timeout to check auth after a period to get latest notiser and check if user still logged in
  useEffect(() => {
    const intervalId = setInterval(() => {
      checkAuth();
      console.log("Checking auth...");
    }, 60 * 1000); // 1 minut

    return () => {
      clearInterval(intervalId);
    };
  }, [checkAuth]);


  useEffect(() => {
    checkAuth();
  }, [checkAuth])

  useEffect(() => {
    if(user){
      forceUpdate(n => n+1);
    }
  }, [user]);
   

  const [showBackdrop, setShowBackdrop] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (isCheckingAuth) {
      timeoutId = setTimeout(() => setShowBackdrop(true), 300);
    } else {
      setShowBackdrop(false);
    }
    return () => clearTimeout(timeoutId);
  }, [isCheckingAuth]);


  return (
    <ThemeProvider theme={theme}>
        <div>
          {/* we can use the this top level div to add our background color or image and then
          add our navbar here to avoid imports everywhere and keeping DRY.  */}
          <Routes>
            {standardRoutes(user)}

            {user && (
              ((role === "admin" || role === "superadmin" || role === "dev") && adminRoutes(role)) 
              ||
              (role === "trainer" && trainerRoutes(role))
              ||
              (role === "referee" && refereeRoutes(role)))
            }


            {!isCheckingAuth && !user && <Route path='*' element={<Navigate to={isAuthenticated ? "/" : "/login"} replace/>}/> }
           </Routes>

        <Toaster/>
          <Backdrop sx={{zIndex:4}} open={showBackdrop}>
          <CircularProgress style={{ color: 'red', position: 'absolute', top: '50%', left: '50%'}}/>
        </Backdrop>
      </div>
    </ThemeProvider>
  )
}

export default App;