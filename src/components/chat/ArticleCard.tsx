import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import mascotImg from "@/assets/xiaotuan-mascot.png";

interface ArticleCardProps {
  content: string;
}

const today = new Date();
const dateStr = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;

const ArticleCard = ({ content }: ArticleCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl shadow-card border border-border overflow-hidden"
    >
      {/* Header strip */}
      <header className="px-5 pt-5 pb-4 bg-gradient-to-b from-muted/60 to-card border-b border-border/60">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
          <span className="flex items-center gap-1.5">
            <img src={mascotImg} alt="" className="w-4 h-4 rounded-full" />
            小团和你的对话
          </span>
          <span>{dateStr}</span>
        </div>
      </header>

      {/* Body */}
      <div className="px-5 py-5">
        <div className="prose prose-sm max-w-none
          prose-headings:font-bold
          prose-h1:text-[19px] prose-h1:leading-snug prose-h1:mt-0 prose-h1:mb-3 prose-h1:tracking-tight
          prose-h3:text-[15px] prose-h3:mt-6 prose-h3:mb-2 prose-h3:pb-1.5 prose-h3:border-b prose-h3:border-border/60
          prose-p:text-[14px] prose-p:leading-[1.75] prose-p:text-foreground/85 prose-p:my-2.5
          prose-strong:text-foreground prose-strong:font-semibold
          prose-blockquote:not-italic prose-blockquote:border-l-2 prose-blockquote:border-primary/50
          prose-blockquote:bg-muted/40 prose-blockquote:rounded-r-md
          prose-blockquote:px-3 prose-blockquote:py-2 prose-blockquote:my-3
          prose-blockquote:text-[13px] prose-blockquote:text-muted-foreground
          prose-li:text-[14px] prose-li:my-1
          prose-hr:my-5 prose-hr:border-border">
          <ReactMarkdown
            components={{
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary/50 bg-muted/40 rounded-r-md px-3 py-2 my-3 text-[13px] text-muted-foreground [&_p]:my-1 [&_p]:text-muted-foreground">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        <div className="mt-5 pt-3 border-t border-border/60 text-[11px] text-muted-foreground text-center">
          内容由 AI 生成 · 仅供参考
        </div>
      </div>
    </motion.article>
  );
};

export default ArticleCard;
