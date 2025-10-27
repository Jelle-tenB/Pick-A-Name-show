//TODO: Make each await their own async
(async () => {
    
    const apiCaller = new ApiCaller()
    var cookie;
    
    // pending dislike queue (deduplicated)
    const pendingDislikes = new Set();
    const FLUSH_INTERVAL = 30000; // 30 seconds
    const flushTimer = setInterval(() => {
        flushDislikes().catch(()=>{});
    }, FLUSH_INTERVAL);

    try {
        cookie = await apiCaller.cookyLogIn();
    } catch (e) {
        window.location.assign('../html/login.html');
        return;
    }

    const likedList1 = document.getElementById("likedList1");
    const likedList2 = document.getElementById("likedList2");
    const likedList3 = document.getElementById("likedList3");

    const liked1 = await apiCaller.getGroupLiked()

    const likeList = await apiCaller.getLikedList()
    // const liked2 = likeList.map(item => item.name);
    // keep id  name so we can request similar names by id
    const liked2 = likeList.map(item => ({
        id: item["name id"] || item["name_id"] || item.id,
        name: item.name
    }));

    const groupKeys = cookie["group codes"];
    const groupCode1 = Object.keys(groupKeys)[0]?.toString() || null;
    const groupCode2 = Object.keys(groupKeys)[1]?.toString() || null;

    if (Object.keys(groupKeys).length > 0) {
        var mutualList = liked1.reduce((acc, item) => {
            const groupCode = item["group code"];
            if (!groupCode) return acc; // skip if groupCode is falsy
            const entry = { [item["name id"]]: item["name"] };
            if (!acc[groupCode]) acc[groupCode] = [];
            acc[groupCode].push(entry);
            return acc;
        }, {});
    }

    let partnerList1 = null;
    let partnerList2 = null;
    if (groupCode1){
        partnerList1 = await apiCaller.PartnersLiked(groupCode1)
        // console.log(partnerList1)
    }
    if (groupCode2){
        partnerList2 = await apiCaller.PartnersLiked(groupCode2)
    }

    // const sortedLiked2 = liked2.slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    const sortedLiked2 = liked2.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    likedList1.innerHTML = '';

    if (mutualList && Object.keys(mutualList).length > 0) {
        Object.keys(mutualList).forEach(groupCode => {
            const li = document.createElement("li");
            li.classList.add("groupedList");
            const groupHeader = document.createElement("h3");

            let partnerName = cookie["group codes"][groupCode] || "Unknown Partner";
            groupHeader.textContent = `Group: ${groupCode} - Partner: ${partnerName}`;
            likedList1.appendChild(groupHeader);

            liked1.forEach(item => {

                const li = document.createElement("li");
                li.classList.add("list1");

                const nameSpan = document.createElement("span");
                let selectedGroup = item["group code"] === groupCode;
                if (selectedGroup) {
                    nameSpan.textContent = item.name;
                    nameSpan.classList.add("name-item");

                    const Transfer1 = document.createElement("button");
                    Transfer1.type = "button";
                    Transfer1.textContent = "Similar names";
                    Transfer1.classList.add("Transfer1");
                    // attach name id so we can request similar names
                    Transfer1.dataset.nameId = item["name id"] || item.id;

                    const Teleport1 = document.createElement("button");
                    Teleport1.type = "button";
                    Teleport1.textContent = "Remove name";
                    Teleport1.classList.add("Teleport1");
                    // attach id for remove action (will be queued)
                    Teleport1.dataset.nameId = item["name id"] || item.id;

                    li.appendChild(nameSpan);
                    li.appendChild(Transfer1);
                    li.appendChild(Teleport1);

                    likedList1.appendChild(li)};
            });
        });
    }

    sortedLiked2.forEach(item => {

        const li = document.createElement("li");
        li.classList.add("list2");

        const nameSpan2 = document.createElement("span");
        nameSpan2.textContent = item;
        nameSpan2.textContent = item.name;
        nameSpan2.classList.add("name-item");

        const Transfer2 = document.createElement("button");
        Transfer2.textContent = "Similar names";  
        Transfer2.classList.add("Transfer2");  
        Transfer2.dataset.nameId = item.id;

        const Teleport2 = document.createElement("button");
        Teleport2.textContent = "Remove name";  
        Teleport2.classList.add("Teleport2"); 
        // attach id for remove action (will be queued)
        Teleport2.dataset.nameId = item.id;

        li.appendChild(nameSpan2);
        li.appendChild(Transfer2);
        li.appendChild(Teleport2);

        likedList2.appendChild(li);
    });

    function renderPartnerList(partnerList, groupCode, container, cookie) {
        if (partnerList && partnerList.length > 0) {
            const groupHeader = document.createElement("h3");
            let partnerName = cookie["group codes"][groupCode] || "Unknown Partner";
            groupHeader.textContent = `Group: ${groupCode} - Partner: ${partnerName}`;
            container.appendChild(groupHeader);

            partnerList.forEach(item => {
                const li = document.createElement("li");
                li.classList.add("list3");

                const nameSpan3 = document.createElement("span");
                nameSpan3.textContent = item.name;
                nameSpan3.classList.add("name-item");

                const Transfer3 = document.createElement("button");
                Transfer3.textContent = "Similar names";
                Transfer3.classList.add("Transfer3");
                Transfer3.dataset.nameId = item["name id"] || item.id;

                const Teleport3 = document.createElement("button");
                Teleport3.textContent = "Remove name";
                Teleport3.classList.add("Teleport3");
                // attach id for remove action (will be queued)
                Teleport3.dataset.nameId = item["name id"] || item.id;

                li.appendChild(nameSpan3);
                li.appendChild(Transfer3);
                li.appendChild(Teleport3);

                container.appendChild(li);
            });
        }
    }

    renderPartnerList(partnerList1, groupCode1, likedList3, cookie);
    renderPartnerList(partnerList2, groupCode2, likedList3, cookie);

    let List1 = document.getElementById("mutualList");

    List1.addEventListener("click", function() {    
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel) {
            panel.style.display = (panel.style.display === "block") ? "none" : "block";
        }
    });

    let List2 = document.getElementById("Partnerlist");

    List2.addEventListener("click", function() {    
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel) {
            panel.style.display = (panel.style.display === "block") ? "none" : "block";
        }
    });

    let List3 = document.getElementById("Userlist");

    List3.addEventListener("click", function() {    
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel) {
            panel.style.display = (panel.style.display === "block") ? "none" : "block";
        }
    });

    // Delegated handler for "Similar names" buttons and Remove buttons (queued)
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        if (btn.classList.contains('Transfer1') || btn.classList.contains('Transfer2') || btn.classList.contains('Transfer3')) {
            const nameId = btn.dataset.nameId;
            if (!nameId) {
                alert('No name id available for this item.');
                return;
            }
            await showSimilar(nameId);
            return;
        }

        // Remove (queue for batched deleteDislike)
        if (btn.classList.contains('Teleport1') || btn.classList.contains('Teleport2') || btn.classList.contains('Teleport3')) {
            const nameId = btn.dataset.nameId;
            if (!nameId) {
                alert('No name id available for this item.');
                return;
            }

            // parse id to integer and validate, then add to queue (deduplicated)
            const parsedId = Number(nameId);
            if (!Number.isInteger(parsedId)) {
                console.warn('Attempted to queue invalid id:', nameId);
                alert('Invalid name id');
                return;
            }
            pendingDislikes.add(parsedId);

            // remove the list item from the DOM immediately for UX
            const li = btn.closest('li');
            if (li && li.parentNode) li.parentNode.removeChild(li);

            // small safeguard: flush if queue grows very large
            if (pendingDislikes.size >= 200) {
                try { await flushDislikes(); } catch(e){ console.error(e) }
            }
            return;
        }
    });

    // Fetch and display similar names (simple modal)
    async function showSimilar(nameId) {
        try {
            // Try ApiCaller helper if available
            let res;
            if (typeof apiCaller.getSimilar === 'function') {
                res = await apiCaller.getSimilar(nameId);
            }

            const items = Array.isArray(res) ? res : (res.names || res.data || []);
            showModal(items);
        } catch (err) {
            console.error(err);
            alert('Could not load similar names.');
        }
    }

    function showModal(items) {
        // remove existing
        const existing = document.getElementById('similarModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'similarModal';
        modal.style = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:white;padding:1rem;z-index:9999;border:1px solid #ccc;max-height:70vh;overflow:auto;';
        const close = document.createElement('button');
        close.textContent = 'Close';
        close.style = 'float:right';
        close.addEventListener('click', () => modal.remove());
        modal.appendChild(close);

        const title = document.createElement('h3');
        title.textContent = 'Similar names';
        modal.appendChild(title);

        if (!items || items.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No similar names found.';
            modal.appendChild(p);
        } else {
            const ul = document.createElement('ul');
            items.forEach(it => {
                const li = document.createElement('li');
                li.textContent = typeof it === 'string' ? it : (it.name || JSON.stringify(it));
                ul.appendChild(li);
            });
            modal.appendChild(ul);
        }

        document.body.appendChild(modal);
    }

    // flush function for pending dislikes
async function flushDislikes() {
        if (pendingDislikes.size === 0) return;
        const ids = Array.from(pendingDislikes);
        // clear early to avoid double-send; re-add on failure
        pendingDislikes.clear();
        try {
            // use ApiCaller.deleteLike which expects an array of ids
            await apiCaller.deleteLike(ids);
        } catch (err) {
            console.error('Failed to flush pending removals, re-queueing', err);
            // ensure re-queued ids are integers
            ids.forEach(id => {
                const n = Number(id);
                if (Number.isInteger(n)) pendingDislikes.add(n);
            });
            throw err;
        }
    }

    // try to send remaining ids on unload (best-effort)
    window.addEventListener('beforeunload', () => {
        if (pendingDislikes.size === 0) return;
        const ids = Array.from(pendingDislikes);

        try {
            // use ApiCaller.deleteLike which expects an array of ids
            apiCaller.deleteLike(ids);
        } catch (err) {
            console.error('Failed to flush pending removals, re-queueing', err);
            // ensure re-queued ids are integers
            ids.forEach(id => {
                const n = Number(id);
                if (Number.isInteger(n)) pendingDislikes.add(n);
            });
            throw err;
        }
    });

    // expose manual flush for debugging
    window._flushPendingDislikes = flushDislikes;

})();