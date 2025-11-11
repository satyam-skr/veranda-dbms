import { Routes, Route } from 'react-router-dom';
import Protected from '../components/Protected';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import Home from '../pages/home/Home';
import OlxList from '../pages/olx/OlxList';
import Mess from '../pages/mess/Mess';
import SuperAdmin from '../pages/admin/SuperAdmin';
import TransportPage from "../pages/transport/TransportPage";
import PollsPage from '../pages/shop/PollsPage';
import PollDetails from '../components/polls/PollDetails';

const Router = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/transport" element={<TransportPage />} />
      
      <Route
        path="/"
        element={
          <Protected>
            <Home />
          </Protected>
        }
      />
      
      <Route
        path="/olx"
        element={
          <Protected>
            <OlxList />
          </Protected>
        }
      />
      
      <Route
        path="/mess"
        element={
          <Protected>
            <Mess />
          </Protected>
        }
      />
      
      <Route
        path="/admin"
        element={
          <Protected requireRole="super_admin">
            <SuperAdmin />
          </Protected>
        }
      />
      <Route
        path="/shop/polls"
        element={
          <Protected>
            <PollsPage />
          </Protected>
        }
      />
      
      <Route
        path="/shop/polls/:id"
        element={
          <Protected>
            <PollDetails />
          </Protected>
        }
      />
    </Routes>

  );
};

export default Router;
