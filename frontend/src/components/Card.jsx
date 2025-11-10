const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      {...props} // ✅ this forwards onClick and other events
      className={`bg-card rounded-lg shadow-md p-6 border border-border transition-all duration-200 
        hover:shadow-lg hover:-translate-y-[1px] cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
