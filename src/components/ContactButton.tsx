import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, ChevronUp } from "lucide-react";
import { useState } from "react";

const ContactButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Contact options */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 bg-background border rounded-lg shadow-lg p-2 min-w-[160px]">
          <Button
            variant="ghost"
            onClick={() => window.open('https://pf.kakao.com/_your_kakao_id')}
            className="justify-start text-left text-sm font-medium text-foreground hover:bg-muted"
          >
            <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
            카카오톡으로 문의
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.open('tel:02-1234-5678')}
            className="justify-start text-left text-sm font-medium text-foreground hover:bg-muted"
          >
            <Phone className="h-4 w-4 mr-2 text-blue-600" />
            전화로 문의
          </Button>
        </div>
      )}

      {/* Main contact button */}
      <Button
        variant="default"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full shadow-lg px-4 py-2 min-w-[100px]"
      >
        <span className="text-sm font-medium">문의하기</span>
        <ChevronUp className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
    </div>
  );
};

export default ContactButton;