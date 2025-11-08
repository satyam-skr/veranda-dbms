import { useState } from 'react';
import { getListings, closeListing } from '../../api/mockApi';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Search, Phone, X } from 'lucide-react';
import { toast } from 'sonner';

const OlxList = () => {
  const [search, setSearch] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [listings, setListings] = useState(() => getListings());
  const { isDomainAdmin } = useAuth();
  const isAdmin = isDomainAdmin('olx');

  const handleSearch = () => {
    setListings(getListings({ q: search, includeInactive: showClosed }));
  };

  const handleCloseListing = (id) => {
    closeListing(id);
    setListings(getListings({ q: search, includeInactive: showClosed }));
    toast.success('Listing closed successfully');
  };

  const filteredListings = showClosed 
    ? listings 
    : listings.filter(l => l.status === 'active');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-foreground">OLX Marketplace</h1>
            {isAdmin && (
              <Badge className="bg-primary text-primary-foreground">Admin View</Badge>
            )}
          </div>

          <Card className="mb-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search">Search Listings</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="search"
                    placeholder="Search by title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showClosed"
                    checked={showClosed}
                    onCheckedChange={(checked) => {
                      setShowClosed(checked);
                      setListings(getListings({ q: search, includeInactive: checked }));
                    }}
                  />
                  <Label htmlFor="showClosed">Show closed</Label>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="relative">
                {listing.status === 'closed' && (
                  <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground">
                    Closed
                  </Badge>
                )}
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">{listing.title}</h3>
                  <p className="text-2xl font-bold text-primary">₹{listing.price}</p>
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Seller:</span> {listing.sellerName}
                    </p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{listing.sellerPhone}</span>
                    </div>
                  </div>

                  {isAdmin && listing.status === 'active' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleCloseListing(listing.id)}
                    >
                      <X className="h-4 w-4" />
                      Close Listing
                    </Button>
                  )}
                  
                  {listing.status === 'closed' && (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Listing Closed
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No listings found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OlxList;
