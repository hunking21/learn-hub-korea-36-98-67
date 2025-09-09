import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Copy, Trash2, Star, StarOff, Settings2 } from "lucide-react";
import { localStore } from "@/store/localStore";
import { ScoringProfile } from "@/types";
import { MCQConfigForm } from "@/components/admin/MCQConfigForm";
import { ShortAnswerConfigForm } from "@/components/admin/ShortAnswerConfigForm";
import { SpeakingRubricConfigForm } from "@/components/admin/SpeakingRubricConfigForm";
import { useToast } from "@/hooks/use-toast";

export default function ScoringConfiguration() {
  const [profiles, setProfiles] = useState<ScoringProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ScoringProfile | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = localStore.subscribe(() => {
      setProfiles(localStore.getScoringProfiles());
    });
    
    setProfiles(localStore.getScoringProfiles());
    return unsubscribe;
  }, []);

  const createNewProfile = () => {
    const newProfile: ScoringProfile = {
      id: crypto.randomUUID(),
      name: "새 채점 프로필",
      description: "새로운 채점 프로필입니다.",
      isDefault: false,
      createdAt: new Date().toISOString(),
      mcqConfig: {
        defaultPoints: 1,
        wrongPenalty: 0
      },
      shortConfig: {
        ignoreWhitespace: true,
        ignoreCase: true,
        typoTolerance: 1,
        regexPatterns: []
      },
      speakingRubrics: [
        {
          id: crypto.randomUUID(),
          label: '유창성',
          description: '말하기 유창성 평가',
          weight: 25,
          maxScore: 4
        },
        {
          id: crypto.randomUUID(),
          label: '발음',
          description: '발음의 정확성',
          weight: 25,
          maxScore: 4
        }
      ]
    };

    localStore.addScoringProfile(newProfile);
    setSelectedProfile(newProfile);
    setIsEditDialogOpen(true);
    setIsCreateDialogOpen(false);
    
    toast({
      title: "채점 프로필 생성됨",
      description: "새로운 채점 프로필이 생성되었습니다."
    });
  };

  const cloneProfile = (profile: ScoringProfile) => {
    if (!cloneName.trim()) {
      toast({
        title: "오류",
        description: "프로필 이름을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    const cloned = localStore.cloneScoringProfile(profile.id, cloneName.trim());
    if (cloned) {
      setCloneName("");
      setIsCloneDialogOpen(false);
      toast({
        title: "프로필 복제됨",
        description: `"${cloned.name}" 프로필이 생성되었습니다.`
      });
    }
  };

  const deleteProfile = (profile: ScoringProfile) => {
    if (profile.isDefault) {
      toast({
        title: "삭제 불가",
        description: "기본 프로필은 삭제할 수 없습니다.",
        variant: "destructive"
      });
      return;
    }

    const success = localStore.deleteScoringProfile(profile.id);
    if (success) {
      toast({
        title: "프로필 삭제됨",
        description: `"${profile.name}" 프로필이 삭제되었습니다.`
      });
    }
  };

  const setAsDefault = (profile: ScoringProfile) => {
    const success = localStore.setDefaultScoringProfile(profile.id);
    if (success) {
      toast({
        title: "기본 프로필 설정됨",
        description: `"${profile.name}"이(가) 기본 프로필로 설정되었습니다.`
      });
    }
  };

  const updateProfile = (updatedProfile: ScoringProfile) => {
    localStore.updateScoringProfile(updatedProfile.id, () => updatedProfile);
    setSelectedProfile(updatedProfile);
    toast({
      title: "프로필 업데이트됨",
      description: "채점 프로필이 성공적으로 업데이트되었습니다."
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">채점 설정</h1>
            <p className="text-muted-foreground mt-2">
              전역 채점 프로필을 관리하고 시험별로 적용할 수 있습니다.
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                새 프로필
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 채점 프로필 생성</DialogTitle>
                <DialogDescription>
                  새로운 채점 프로필을 생성합니다. 기본값으로 시작하여 나중에 수정할 수 있습니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={createNewProfile}>생성</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {profiles.map((profile) => (
            <Card key={profile.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="flex items-center gap-2">
                      {profile.name}
                      {profile.isDefault && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          기본
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!profile.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAsDefault(profile)}
                        title="기본으로 설정"
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProfile(profile);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>프로필 복제</DialogTitle>
                          <DialogDescription>
                            "{profile.name}" 프로필을 복제합니다.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="clone-name">새 프로필 이름</Label>
                            <Input
                              id="clone-name"
                              value={cloneName}
                              onChange={(e) => setCloneName(e.target.value)}
                              placeholder="복제된 프로필 이름을 입력하세요"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCloneName("")}>
                            취소
                          </Button>
                          <Button onClick={() => cloneProfile(profile)}>복제</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    {!profile.isDefault && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>프로필 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{profile.name}" 프로필을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteProfile(profile)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
                
                {profile.description && (
                  <CardDescription>{profile.description}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      객관식 설정
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>기본 배점: {profile.mcqConfig.defaultPoints}점</p>
                      <p>오답 감점: {profile.mcqConfig.wrongPenalty || 0}점</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      주관식 설정
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>공백 무시: {profile.shortConfig.ignoreWhitespace ? '예' : '아니오'}</p>
                      <p>대소문자 구분: {profile.shortConfig.ignoreCase ? '아니오' : '예'}</p>
                      <p>허용 오타: {profile.shortConfig.typoTolerance}개</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      말하기 루브릭
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>항목 수: {profile.speakingRubrics.length}개</p>
                      <p className="text-xs">
                        {profile.speakingRubrics.slice(0, 2).map(r => r.label).join(', ')}
                        {profile.speakingRubrics.length > 2 && ` 외 ${profile.speakingRubrics.length - 2}개`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Profile Dialog */}
        {selectedProfile && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>채점 프로필 편집: {selectedProfile.name}</DialogTitle>
                <DialogDescription>
                  채점 프로필의 설정을 편집합니다.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">기본 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="profile-name">프로필 이름</Label>
                      <Input
                        id="profile-name"
                        value={selectedProfile.name}
                        onChange={(e) => setSelectedProfile({
                          ...selectedProfile,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="profile-desc">설명</Label>
                      <Input
                        id="profile-desc"
                        value={selectedProfile.description || ''}
                        onChange={(e) => setSelectedProfile({
                          ...selectedProfile,
                          description: e.target.value
                        })}
                        placeholder="프로필에 대한 설명을 입력하세요"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* MCQ Config */}
                <MCQConfigForm
                  config={selectedProfile.mcqConfig}
                  onChange={(mcqConfig) => setSelectedProfile({
                    ...selectedProfile,
                    mcqConfig
                  })}
                />

                <Separator />

                {/* Short Answer Config */}
                <ShortAnswerConfigForm
                  config={selectedProfile.shortConfig}
                  onChange={(shortConfig) => setSelectedProfile({
                    ...selectedProfile,
                    shortConfig
                  })}
                />

                <Separator />

                {/* Speaking Rubric Config */}
                <SpeakingRubricConfigForm
                  rubrics={selectedProfile.speakingRubrics}
                  onChange={(speakingRubrics) => setSelectedProfile({
                    ...selectedProfile,
                    speakingRubrics
                  })}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={() => {
                  updateProfile(selectedProfile);
                  setIsEditDialogOpen(false);
                }}>
                  저장
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}