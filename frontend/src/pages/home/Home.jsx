import { Link } from 'react-router-dom';
import { ShoppingBag, UtensilsCrossed, Bus, Store, MessageSquare } from 'lucide-react';
import Header from '../../components/Header';
import Card from '../../components/Card';

const Home = () => {
  const tiles = [
    {
      title: 'OLX',
      description: 'Buy and sell items within campus',
      icon: ShoppingBag,
      link: '/olx',
      color: 'text-primary'
    },
    {
      title: 'Mess',
      description: 'Complaints and meal ratings',
      icon: UtensilsCrossed,
      link: '/mess',
      color: 'text-accent'
    },
    {
      title: 'Transport',
      description: 'Check Transport',
      icon: Bus,
      link: '/transport',
      color: 'text-muted-foreground'
    },
    {
      title: 'Shop (Poll)',
      description: 'Poll for new shop items',
      icon: Store,
      link: '/shop/polls',
      color: 'text-muted-foreground'
    },
    {
      title: 'General Complaint',
      description: 'Report any issues',
      icon: MessageSquare,
      link: '/mess',
      color: 'text-destructive'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Welcome to Veranda
            </h1>
            <p className="text-lg text-muted-foreground">
              Your campus community platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiles.map((tile) => {
              const Icon = tile.icon;
              const content = (
                <Card className={`h-full transition-all ${!tile.disabled ? 'hover:shadow-lg cursor-pointer hover:scale-105' : 'opacity-60 cursor-not-allowed'}`}>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Icon className={`h-12 w-12 ${tile.color}`} />
                    <h2 className="text-xl font-semibold text-foreground">
                      {tile.title}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {tile.description}
                    </p>
                  </div>
                </Card>
              );

              return tile.disabled ? (
                <div key={tile.title}>{content}</div>
              ) : (
                <Link key={tile.title} to={tile.link}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
