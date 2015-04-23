if (Meteor.isServer) {
    // dummy
}

Dicts = new Mongo.Collection("dicts");

if (Meteor.isClient) {
    // At the top of our client code
    Meteor.subscribe("dicts");

    // This code only runs on the client
    // Replace the existing Template.body.helpers
    Template.body.helpers({
        candidates: function() {
            console.log(Session.get("candidate"));
            if (Session.get("candidate")) {
                var key = Session.get("candidate").toUpperCase();
                var regex = "^" + key;
                console.log(regex);
                return Dicts.find({
                    key: {$regex:regex}
                }, {
                    sort: {
                        createdAt: -1
                    }
                });
            }
        },
        dicts: function() {
            if (Session.get("searchWord")) {
                var key = Session.get("searchWord").toUpperCase();
                return Dicts.find({
                    key: key
                }, {
                    sort: {
                        createdAt: -1
                    }
                });
            } else {
                return Dicts.find({}, {
                    sort: {
                        createdAt: -1
                    }
                });
            }
        },
        allCount: function() {
            return Dicts.find().count();
        },
        searchWord: function() {
            return Session.get("searchWord");
        }
    });


    // Inside the if (Meteor.isClient) block, right after Template.body.helpers:
    Template.body.events({
        "submit .add-dict": function(event) {
            // This function is called when the new dict form is submitted

            var word = event.target.word.value;
            var description = event.target.description.value;

            Meteor.call("addDict", word, description);

            // Clear form
            event.target.description.value = "";

            // Prevent default form submit
            return false;
        },
        // Add to Template.body.events
        "submit .search": function(event) {
            Session.set("searchWord", event.target.word.value);
            // Prevent default form submit
            return false;
        },
        "input .search": function(event) {
            
            setTimeout(function() {
                Session.set("candidate", event.target.value);
                //console.log(event.target.value);
            }, 500);
        }
    });

    Template.dict.helpers({
        isOwner: function() {
            return this.owner === Meteor.userId();
        }
    });

    // In the client code, below everything else
    Template.dict.events({
        "click .delete": function() {
            if (confirm("Do you really want to delete this?")) {
                Meteor.call("deleteDict", this._id);
            }
        }
    });

    // In the client code, below everything else
    Template.candidate.events({
        "click .candidate": function(event) {
            console.log(event.target.text);
            Session.set("searchWord", event.target.text);
            Session.set("candidate", '');
            // Prevent default form submit
            return false;
        }
    });


    // At the bottom of the client code
    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });
}



// At the bottom of simple-todos.js, outside of the client-only block
Meteor.methods({
    addDict: function(word, description) {
        // Make sure the user is logged in before inserting a dict
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        var key = word.toUpperCase();

        Dicts.insert({
            key: key,
            word: word,
            description: description,
            createdAt: new Date(),
            owner: Meteor.userId(),
            username: Meteor.user().username
        });
    },
    deleteDict: function(dictId) {
        // Inside the deleteDict method
        var dict = Dicts.findOne(dictId);
        if (dict.owner !== Meteor.userId()) {
            // If the dict is private, make sure only the owner can delete it
            throw new Meteor.Error("not-authorized");
        }
        Dicts.remove(dictId);
    }
});
