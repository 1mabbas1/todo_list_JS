// require node modules and initialise express app
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//create mongoose database hosted online on Mongoose Atlas
mongoose.connect(process.env.SERVERURL)

const itemsSchema = {
  name: {
    type: String,
    required: true
  }
};

const Item = mongoose.model("Item", itemsSchema);

const item = new Item({
  name: "Press + to add a new item"
});

const item1 = new Item({
  name: "<-- press to tick items off"
});
const defaultItems = [item, item1];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


// root route with current date as heading
app.get('/', (req, res) => {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length == 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Added");
        }
      });
      res.redirect("/");
    } else {
      res.render('list', {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });

});


// post new items into the respective routes
app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;


  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/")
  } else {
    List.findOne({
      name: listName
    }, function(error, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName)
    });
  }



});


// delete items routes
app.post("/delete", function(req, res) {
  const checkedItem = (req.body.check);
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItem, function(err) {
        if (!err) {
          console.log("Removed");
          res.redirect("/");
        }});} else {
        List.findOneAndUpdate({
          name: listName
        }, {
          $pull: {
            items: {
              _id: checkedItem
            }
          }
        }, function(err, foundList) {
          if (!err) {
            res.redirect("/" + listName)
          }
        })
      }

});

// dynamic routes
app.get("/:customListName", function(req, res) {
  const customListName = _capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName)
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  })

});


// about page with loren ipsum
app.get("/about", function(req, res) {
  res.render("about");
});



// host on heroku server
// let port = process.env.PORT;
// if (port == null || port == "") { port = 3000; }
app.listen(process.env.PORT || 5000)


//host server locally on port 3000
// app.listen(port, function() {
//   console.log("Server has started successfully!");
// });
