import AppLayout from "@/components/layout/AppLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <AppLayout 
      title="자주하는 질문" 
      subtitle="TN Academy 서비스에 대한 궁금한 점을 확인해보세요"
      showBackButton={true} 
      showHomeButton={true}
    >
      <div className="max-w-4xl mx-auto">
        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="border rounded-lg px-6">
            <AccordionTrigger className="text-left font-semibold">
              테스트는 어떻게 진행되나요?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              온라인으로 진행되는 테스트로, 브라우저에서 바로 응시할 수 있습니다. 
              테스트 유형을 선택하고, 안내에 따라 진행하시면 됩니다. 
              모든 테스트는 실시간으로 진행되며, 결과는 즉시 확인 가능합니다.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border rounded-lg px-6">
            <AccordionTrigger className="text-left font-semibold">
              테스트 결과는 언제 확인할 수 있나요?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              테스트 완료 즉시 결과를 확인할 수 있습니다. 
              상세한 분석 결과와 학습 가이드는 테스트 종료 후 제공되며, 
              마이페이지에서 언제든지 다시 확인 가능합니다.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border rounded-lg px-6">
            <AccordionTrigger className="text-left font-semibold">
              테스트 시간은 얼마나 걸리나요?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              테스트 유형에 따라 다르지만, 일반적으로 30분~60분 정도 소요됩니다. 
              진단평가는 약 30분, 정규 테스트는 50~60분 정도입니다. 
              테스트 시작 전에 예상 소요 시간을 안내해드립니다.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border rounded-lg px-6">
            <AccordionTrigger className="text-left font-semibold">
              테스트 중간에 일시정지가 가능한가요?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              네, 가능합니다. 테스트 중 일시정지 버튼을 누르면 진행 상황이 저장되며, 
              나중에 이어서 진행할 수 있습니다. 단, 제한시간이 있는 테스트의 경우 
              일시정지 중에도 시간이 계속 흘러갑니다.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border rounded-lg px-6">
            <AccordionTrigger className="text-left font-semibold">
              회원가입 없이도 테스트를 볼 수 있나요?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              일부 체험용 테스트는 회원가입 없이도 이용 가능하지만, 
              정확한 결과 분석과 학습 이력 관리를 위해서는 회원가입을 권장합니다. 
              회원가입 시 더 다양한 테스트와 맞춤형 학습 가이드를 제공받을 수 있습니다.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="border rounded-lg px-6">
            <AccordionTrigger className="text-left font-semibold">
              테스트 결과는 어떻게 활용할 수 있나요?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              테스트 결과를 바탕으로 개인 맞춤형 학습 계획을 제공합니다. 
              부족한 영역에 대한 보충 학습 자료와 추천 강의를 확인할 수 있으며, 
              정기적인 재테스트를 통해 실력 향상 정도를 추적할 수 있습니다.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7" className="border rounded-lg px-6">
            <AccordionTrigger className="text-left font-semibold">
              모바일에서도 테스트가 가능한가요?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              네, 모바일 브라우저에서도 테스트가 가능합니다. 
              다만 더 나은 테스트 경험을 위해서는 PC나 태블릿 사용을 권장합니다. 
              모바일에서 테스트 시 화면 크기에 따른 일부 제약이 있을 수 있습니다.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8" className="border rounded-lg px-6">
            <AccordionTrigger className="text-left font-semibold">
              테스트 비용은 얼마인가요?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              기본 진단평가는 무료로 제공되며, 정규 테스트는 유형에 따라 차등 요금이 적용됩니다. 
              정확한 요금 정보는 테스트 선택 페이지에서 확인할 수 있으며, 
              패키지 상품을 통해 더 경제적으로 이용 가능합니다.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9" className="border rounded-lg px-6">
            <AccordionTrigger className="text-left font-semibold">
              기술적인 문제가 발생하면 어떻게 해야 하나요?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              테스트 중 기술적 문제 발생 시 즉시 고객센터로 연락주세요. 
              카카오톡 채널 또는 전화(02-1234-5678)로 문의 가능하며, 
              문제 해결까지 테스트 시간은 자동으로 연장됩니다.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10" className="border rounded-lg px-6">
            <AccordionTrigger className="text-left font-semibold">
              환불 정책은 어떻게 되나요?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              테스트 시작 전에는 100% 환불 가능하며, 
              테스트 진행 중 기술적 문제로 인한 중단 시에도 전액 환불됩니다. 
              자세한 환불 정책은 이용약관에서 확인하실 수 있습니다.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-3">추가 문의사항이 있으신가요?</h3>
          <p className="text-muted-foreground mb-4">
            위에서 답을 찾지 못하신 경우, 언제든지 고객센터로 문의해 주세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">카카오톡:</span>
              <span className="text-sm text-muted-foreground">TN Academy 채널</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">전화:</span>
              <span className="text-sm text-muted-foreground">02-1234-5678</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FAQ;