interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

const ProgressIndicator = ({ 
  currentStep, 
  totalSteps, 
  stepLabels = [] 
}: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep >= stepNumber;
          const isLast = stepNumber === totalSteps;
          
          return (
            <div key={stepNumber} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {stepNumber}
              </div>
              {stepLabels[index] && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {stepLabels[index]}
                </span>
              )}
              {!isLast && (
                <div className={`w-12 h-0.5 mx-4 transition-colors ${
                  currentStep > stepNumber ? 'bg-primary' : 'bg-muted'
                }`}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;