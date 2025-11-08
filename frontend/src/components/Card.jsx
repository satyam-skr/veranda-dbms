const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-card rounded-lg shadow-md p-6 border border-border ${className}`}>
      {children}
    </div>
  );
};

export default Card;
