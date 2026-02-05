import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [criticalCount, setCriticalCount] = useState(0);
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(API_URL + '/api/jobs');
            const jobs = response.data.data;

            const critical = jobs.filter(job => {
                if (!job.expected_delivery_date || job.status === 'Completed' || job.status === 'Dispatched') return false;
                const dueDate = new Date(job.expected_delivery_date + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffTime = dueDate - today;
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            });

            setCriticalCount(critical.length);
            setNotifications(critical);
        } catch (error) {
            console.error("Error fetching notifications for sidebar:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <NotificationContext.Provider value={{ criticalCount, notifications, refreshNotifications: fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
