using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Chat;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IChatRepository
    {
        Task AddChatMessage(string stageId, int segment, ChatMessage chatMessage);
        Task AddChatReaction(string stageId, int segment, ChatReaction chatReaction);
        Task<List<ChatMessageOutput>> GetChatMessages(string stageId, int segment, long? timestamp);
    }
}
