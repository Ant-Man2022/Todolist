const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

//Connect to mongoose
mongoose.connect("mongodb+srv://andre:05101520@cluster0.strkucl.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser: true});

const app = express();
app.set('view engine', 'ejs');



app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Create schema 
const itemsSchema = {
    name: String
}
//Model
const Item = mongoose.model("Item", itemsSchema);

//Mongoose documents
const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

//Putting all documents in an array
const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
    
    //Find all document inside my root/route
    Item.find({}, function(err, foundItems) {

        if(foundItems.length === 0) {
            //Insert all docs in our database
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                }
                else{
                    console.log("Successfully saved default item in DB");
                }
            });
        
        res.redirect("/");
        
        }
        else {
            res.render("list", {listTitle: "Today", NewListItems: foundItems});
        }


        
    })

    
})



app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList) {
        if(!err){
            if(!foundList) {
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
            
                list.save();
                res.redirect("/" + customListName);
            }
            else{
                //Show an existing list
                res.render("list", {listTitle: foundList.name, NewListItems: foundList.items})
            }
        }
    })

})


app.post("/", function(req, res) {
    const itemName = req.body.Item;
    const listName = req.body.button;

    const item = new Item({
        name:itemName
    });

    if(listName === "Today") {
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
    
});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if(!err) {
                console.log("Successfully deleted checked item");
                res.redirect("/");
            }
        })
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {ittems: {_id: checkedItemId}}}, function(err, foundList) {
            if(!err) {
                res.redirect("/" + listName);
            }
        })
    }

    
})

/* app.get("/work", function(req, res) {
    res.render("list", {listTitle: "Work List", NewListItems: workItems});
})

app.post("/work", function(req, res) {
    let item = req.body.Item;
    workItems.push(item);
    res.redirect("/work");
})
 */
app.listen(process.env.PORT || 3000, function() {
    console.log("Server is runnig on port 3000...")
})

