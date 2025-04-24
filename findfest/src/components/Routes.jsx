import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth } from "../config/firebase";
import Layout from "./Layout";
import Home from "./Home";
import MyEvents from "./MyEvents";
import AddEvent from "./AddEvent";
import EventPage from "./EventPage";
import AboutUs from "./About";
import ContactUs from "./Contact";
import SignIn from "./SignIn";
import EventProvider from "./EventContext";
import MyAccount from "./MyAccount";
import AdminPage from "./AdminPage";
import UserProfile from "./UserProfile"; // ✅ Added import

const ProtectedRoute = ({ user, children }) => {
  return user ? children : <Navigate to="/sign-in" replace />;
};

const AppRoutes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAllFilters = () => {
    setSearchQuery("");
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <EventProvider>
      <Routes>
        <Route
          path="/"
          element={
            <Layout
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              clearAllFilters={clearAllFilters}
              user={user}
            />
          }
        >
          <Route index element={<Home searchQuery={searchQuery} />} />
          <Route path="event/:id" element={<EventPage />} />
          <Route path="about" element={<AboutUs />} />
          <Route path="contact" element={<ContactUs />} />
          <Route path="user/:uid" element={<UserProfile />} /> {/* ✅ New route */}

          <Route
            path="my-events"
            element={
              <ProtectedRoute user={user}>
                <MyEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="add-event"
            element={
              <ProtectedRoute user={user}>
                <AddEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-account"
            element={
              <ProtectedRoute user={user}>
                <MyAccount />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/event/:id"
            element={
              <ProtectedRoute user={user}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route path="sign-in" element={<SignIn />} />
        </Route>

        <Route path="*" element={<Home searchQuery={searchQuery} />} />
      </Routes>
    </EventProvider>
  );
};

export default AppRoutes;
