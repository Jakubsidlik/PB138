let lessons = [{ id: 1, likes: "0", userVote: null }];
let lessonId = 1;
let vote = "LIKE";

let nextLessons = lessons.map(l => {
  if (l.id === lessonId) {
    let likes = l.likes ?? 0
    let dislikes = l.dislikes ?? 0
    const oldVote = l.userVote
    
    if (oldVote === 'LIKE') likes--
    if (oldVote === 'DISLIKE') dislikes--
    if (vote === 'LIKE') likes++
    if (vote === 'DISLIKE') dislikes++
    
    return { ...l, userVote: vote, likes, dislikes }
  }
  return l;
});

console.log(nextLessons);
