import { useState } from 'react';
import Header from '../../components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import ComplaintTab from './ComplaintTab';
import RatingTab from './RatingTab';

const Mess = () => {
  const [activeTab, setActiveTab] = useState('complaint');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Mess Management</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="complaint">Complaints</TabsTrigger>
              <TabsTrigger value="rating">Meal Ratings</TabsTrigger>
            </TabsList>

            <TabsContent value="complaint" className="mt-6">
              <ComplaintTab />
            </TabsContent>

            <TabsContent value="rating" className="mt-6">
              <RatingTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Mess;
