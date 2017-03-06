(function() { // protect the lemmings!

    // in case we want to add stuff in the future
    const GithubAPI = {};
    GithubAPI.urlBase = `https://api.github.com`;
    GithubAPI.endpoints = {
        repos: `repos`,
        users: `users`,
    };
    // super low sec access_token, just reads repos and public user data
    // required to get over aggressive rate limiting of GH api
    GithubAPI.access_token = '71b909c73044cce35b4f234762d81f4bca95a512';

    const getContributors = (username, reponame) => {
        const {urlBase, endpoints, access_token} = GithubAPI;
        const endpoint = [urlBase, endpoints.repos, username, reponame, 'contributors'].join('/') + '?access_token=' + access_token;

        return $.get(endpoint);
    } // getContributors

    const getUser = (username) => {
        const {urlBase, endpoints, access_token} = GithubAPI;
        const endpoint = [urlBase, endpoints.users, username].join('/') + '?access_token=' + access_token;

        return $.get(endpoint);
    } // getUser

    const validateCopyright = (copyrightSelector) => {
        return new Promise((resolve, reject) => {
            if (typeof copyrightSelector === 'undefined') {
                reject('No selector passed in');
            }

            const $copyright = $(copyrightSelector);
            if ($copyright.length === 0) {
                reject('This selector does not exist on page');
            }

            resolve($copyright);
        });
    } // validateCopyright

    const isCopyright = validateCopyright('.js-copyright');
    const contributors = isCopyright
        .then(() => getContributors('Superjisan', 'Informr.US'))
        .then((data) => {
            const userData = data.map((curr) => {
                return getUser(curr.login);
            });

            return Promise.all(userData);
        });

    Promise.all([isCopyright, contributors])
    .then((results) => {
        const [$copyright, data] = results;
        const textStr = data.reduce((_arr, curr, index) => {
            const prefix = (index === data.length - 1) ? 'and ' : '';
            _arr.push(prefix + (`<a href="https://github.com/${curr.login}" target="_blank">${curr.name || curr.login}</a>`));
            return _arr;        
        }, []).join(', ');
        const yearStr = `&copy; ${new Date().getFullYear()} `;
        $copyright.html(yearStr + textStr);
    })
    .catch((e) => {
        console.log(e);
    });
    
})();
