insert into userfriends (user_id, friend_id)

values (
(select id from users where name = 'Pragyan', select id from users where name = 'Pawan'),
(select id from users where name = 'Pragyan', select id from users where name = 'Rohan'),
(select id from users where name = 'Rohan', select id from users where name = 'Pragyan'),
(select id from users where name = 'Pawan', select id from users where name = 'Pragyan')

)
