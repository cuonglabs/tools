function getSession(){

    const raw =
    localStorage.getItem(
        "session"
    );

    if(!raw)
        return null;

    try{

        const session =
        JSON.parse(
            raw
        );

        if(
            new Date(
                session.expireTime
            ) <
            new Date()
        ){

            localStorage.removeItem(
                "session"
            );

            return null;
        }

        return session;
    }
    catch{

        return null;
    }
}

function requireLogin(){

    const session =
    getSession();

    if(!session){

        location.href =
            "login.html?next=" +
            encodeURIComponent(
                location.pathname +
                location.search
            );

        return false;
    }

    return true;
}

function logout(){

    localStorage.removeItem(
        "session"
    );

    location.href =
        "login.html";
}
