import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Star } from "lucide-react";
import { ReadingPassage } from "@/hooks/useReadingPassages";

interface ReadingPassageCardProps {
  passage: ReadingPassage;
  onStart?: (passageId: string) => void;
}

export const ReadingPassageCard = ({ passage, onStart }: ReadingPassageCardProps) => {
  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case 2: return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case 3: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case 4: return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case 5: return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getDifficultyText = (level: number) => {
    const levels = ["매우 쉬움", "쉬움", "보통", "어려움", "매우 어려움"];
    return levels[level - 1] || "보통";
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {passage.title}
            </CardTitle>
            <CardDescription className="mt-2">
              {passage.content.substring(0, 100)}...
            </CardDescription>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary">
            {passage.grade_level}
          </Badge>
          <Badge className={getDifficultyColor(passage.difficulty_level)}>
            <Star className="w-3 h-3 mr-1" />
            {getDifficultyText(passage.difficulty_level)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{passage.question_count || 0}문제</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{passage.total_points || 0}점</span>
            </div>
          </div>
        </div>

        {onStart && (
          <Button 
            onClick={() => onStart(passage.id)} 
            className="w-full"
          >
            시작하기
          </Button>
        )}
      </CardContent>
    </Card>
  );
};