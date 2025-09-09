-- Enable realtime for test tables
ALTER TABLE public.test_masters REPLICA IDENTITY FULL;
ALTER TABLE public.test_versions REPLICA IDENTITY FULL;
ALTER TABLE public.test_sections REPLICA IDENTITY FULL;
ALTER TABLE public.test_section_questions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_masters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_section_questions;