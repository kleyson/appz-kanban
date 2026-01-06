import type { Comment } from '../../types'
import { useCommentEditor } from '../../hooks'
import { formatRelativeTime } from '../../utils/dateUtils'
import MarkdownRenderer from './MarkdownRenderer'

interface CardCommentsSectionProps {
  comments: Comment[]
  mode: 'view' | 'edit'
  currentUserId: number
  currentUserName: string
  onAddComment: (comment: Comment) => void
  onUpdateComment: (id: string, content: string) => void
  onDeleteComment: (id: string) => void
  onEnterEditMode: () => void
}

export default function CardCommentsSection({
  comments,
  mode,
  currentUserId,
  currentUserName,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onEnterEditMode,
}: CardCommentsSectionProps) {
  const {
    newComment,
    setNewComment,
    newCommentTab,
    setNewCommentTab,
    handleAddComment,
    editingCommentId,
    editingContent,
    setEditingContent,
    editingTab,
    setEditingTab,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    sortedComments,
    handleKeyDown,
  } = useCommentEditor({
    comments,
    currentUserId,
    currentUserName,
    onAddComment,
    onUpdateComment,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-slate-400">
          Comments {comments.length > 0 && `(${comments.length})`}
        </label>
      </div>

      {/* Add comment input - always visible */}
      <div className="mb-4">
        {/* Tabs */}
        <div className="flex gap-1 mb-2">
          <button
            type="button"
            onClick={() => setNewCommentTab('write')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              newCommentTab === 'write'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setNewCommentTab('preview')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              newCommentTab === 'preview'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Preview
          </button>
        </div>

        {newCommentTab === 'write' ? (
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddComment)}
            placeholder="Add a comment..."
            className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm px-4 py-3 min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-slate-500"
          />
        ) : (
          <div className="p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl min-h-[60px]">
            {!newComment.trim() ? (
              <span className="text-slate-500 italic">Nothing to preview</span>
            ) : (
              <MarkdownRenderer content={newComment} />
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-500">Cmd+Enter to submit</p>
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Comment
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {sortedComments.map((comment) => (
          <div
            key={comment.id}
            className="group p-3 bg-slate-900/30 border border-slate-700/30 rounded-xl"
          >
            {/* Comment header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white">{comment.authorName}</span>
                <span className="text-xs text-slate-500">
                  {formatRelativeTime(comment.createdAt)}
                </span>
                {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                  <span className="text-xs text-slate-600">(edited)</span>
                )}
              </div>

              {/* Edit/Delete actions - only for comment author and in edit mode */}
              {mode === 'edit' && comment.authorId === currentUserId && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStartEdit(comment)}
                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteComment(comment.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Hint to enter edit mode in view mode */}
              {mode === 'view' && comment.authorId === currentUserId && (
                <button
                  onClick={onEnterEditMode}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-slate-400 transition-all cursor-pointer"
                  title="Double-click to edit card"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Comment content */}
            {editingCommentId === comment.id ? (
              <div className="space-y-2">
                {/* Tabs */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingTab('write')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      editingTab === 'write'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTab('preview')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      editingTab === 'preview'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Preview
                  </button>
                </div>

                {editingTab === 'write' ? (
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                    placeholder="Edit your comment..."
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm px-4 py-3 min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-slate-500"
                  />
                ) : (
                  <div className="p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl min-h-[60px]">
                    {!editingContent.trim() ? (
                      <span className="text-slate-500 italic">Nothing to preview</span>
                    ) : (
                      <MarkdownRenderer content={editingContent} />
                    )}
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-2 py-1 text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editingContent.trim()}
                    className="px-2 py-1 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded text-sm font-medium disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <MarkdownRenderer content={comment.content} />
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-slate-500 text-sm italic text-center py-2">No comments yet</p>
        )}
      </div>
    </div>
  )
}
