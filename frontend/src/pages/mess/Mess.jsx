import { useState } from 'react';
import Header from '../../components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '../../context/AuthContext';
import ComplaintTab from './ComplaintTab';
import RatingTab from './RatingTab';
import FoodItemsTab from './FoodItemsTab';
import MenuTab from './MenuTab';
import NoticesTab from './NoticesTab';

const Mess = () => {
  const { isDomainAdmin } = useAuth();
  const isAdmin = isDomainAdmin('mess');
  const [activeTab, setActiveTab] = useState('complaint');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Mess Management</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'max-w-4xl grid-cols-5' : 'max-w-md grid-cols-2'}`}>
              <TabsTrigger value="complaint">Complaints</TabsTrigger>
              <TabsTrigger value="rating">Meal Ratings</TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger value="food">Food Items</TabsTrigger>
                  <TabsTrigger value="menu">Menu</TabsTrigger>
                  <TabsTrigger value="notices">Notices</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="complaint" className="mt-6">
              <ComplaintTab />
            </TabsContent>

            <TabsContent value="rating" className="mt-6">
              <RatingTab />
            </TabsContent>

            {isAdmin && (
              <>
                <TabsContent value="food" className="mt-6">
                  <FoodItemsTab />
                </TabsContent>

                <TabsContent value="menu" className="mt-6">
                  <MenuTab />
                </TabsContent>

                <TabsContent value="notices" className="mt-6">
                  <NoticesTab />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Mess;
